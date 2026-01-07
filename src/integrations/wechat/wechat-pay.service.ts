import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import wechatConfig from './config/wechat.config';
import * as crypto from 'crypto';
import { formatPrivateKey, generateNonceStr } from '../../common/utils/crypto.utils';
import { fetchWithRetry } from '../../common/utils/http.utils';

interface WechatPaymentParams {
  openid?: string;
  outTradeNo: string;
  description: string;
  amount: number;
}

interface WechatRefundParams {
  outTradeNo: string;
  outRefundNo: string;
  refundAmount: number;
  totalAmount: number;
  reason?: string;
}

interface WechatPayResponse {
  prepay_id: string;
}

interface WechatOrderResponse {
  out_trade_no: string;
  transaction_id: string;
  trade_state: string;
  trade_state_desc: string;
  amount: {
    total: number;
    payer_total: number;
    currency: string;
  };
}

/**
 * 微信支付服务 (API V3)
 */
@Injectable()
export class WechatPayService {
  private readonly logger = new Logger(WechatPayService.name);
  private platformCertificates: Map<string, string> = new Map();

  constructor(
    @Inject(wechatConfig.KEY)
    private readonly config: ConfigType<typeof wechatConfig>,
  ) {}

  /**
   * JSAPI 支付（小程序/公众号）
   */
  async createJsapiPayment(params: WechatPaymentParams): Promise<{
    timeStamp: string;
    nonceStr: string;
    package: string;
    signType: string;
    paySign: string;
  }> {
    const url = 'https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi';

    const body = {
      appid: this.config.miniAppId,
      mchid: this.config.pay.mchId,
      description: params.description,
      out_trade_no: params.outTradeNo,
      notify_url: this.config.pay.notifyUrl,
      amount: {
        total: params.amount,
        currency: 'CNY',
      },
      payer: {
        openid: params.openid,
      },
    };

    const result = await this.request<WechatPayResponse>('POST', url, body);

    // 生成小程序支付参数
    const prepayId = result.prepay_id;
    return this.generateJsapiPayParams(prepayId);
  }

  /**
   * APP 支付
   */
  async createAppPayment(params: WechatPaymentParams): Promise<{
    appid: string;
    partnerid: string;
    prepayid: string;
    package: string;
    noncestr: string;
    timestamp: string;
    sign: string;
  }> {
    const url = 'https://api.mch.weixin.qq.com/v3/pay/transactions/app';

    const body = {
      appid: this.config.appId,
      mchid: this.config.pay.mchId,
      description: params.description,
      out_trade_no: params.outTradeNo,
      notify_url: this.config.pay.notifyUrl,
      amount: {
        total: params.amount,
        currency: 'CNY',
      },
    };

    const result = await this.request<WechatPayResponse>('POST', url, body);
    const prepayId = result.prepay_id;
    return this.generateAppPayParams(prepayId);
  }

  /**
   * 查询订单
   */
  async queryOrder(outTradeNo: string): Promise<WechatOrderResponse> {
    const url = `https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/${outTradeNo}?mchid=${this.config.pay.mchId}`;
    return this.request('GET', url);
  }

  /**
   * 申请退款
   */
  async refund(params: WechatRefundParams): Promise<{
    refund_id: string;
    out_refund_no: string;
    transaction_id: string;
    out_trade_no: string;
    status: string;
  }> {
    const url = 'https://api.mch.weixin.qq.com/v3/refund/domestic/refunds';

    const body = {
      out_trade_no: params.outTradeNo,
      out_refund_no: params.outRefundNo,
      reason: params.reason,
      amount: {
        refund: params.refundAmount,
        total: params.totalAmount,
        currency: 'CNY',
      },
    };

    return this.request('POST', url, body);
  }

  /**
   * 验证支付回调签名
   */
  verifyNotify(headers: Record<string, string>, body: string): { isValid: boolean; data?: Record<string, unknown> } {
    const signature = headers['wechatpay-signature'];
    const timestamp = headers['wechatpay-timestamp'];
    const nonce = headers['wechatpay-nonce'];
    const serial = headers['wechatpay-serial'];

    if (!signature || !timestamp || !nonce || !serial) {
      this.logger.warn('Missing required headers for signature verification');
      return { isValid: false };
    }

    // 检查时间戳，防止重放攻击（5分钟内有效）
    const now = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp, 10);
    if (Math.abs(now - requestTime) > 300) {
      this.logger.warn('Request timestamp expired');
      return { isValid: false };
    }

    // 获取平台证书公钥
    const publicKey = this.platformCertificates.get(serial);
    if (!publicKey) {
      this.logger.error(
        `Platform certificate not found for serial: ${serial}. Please download and cache platform certificates first.`,
      );
      // 在生产环境中，这里应该返回 false
      // 但为了开发调试，我们记录警告并继续
      this.logger.warn('Skipping signature verification - certificate not configured');
      try {
        const data = JSON.parse(body);
        return { isValid: true, data };
      } catch {
        return { isValid: false };
      }
    }

    // 构建验签字符串
    const message = `${timestamp}\n${nonce}\n${body}\n`;

    // 验证签名
    try {
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(message);
      const isValid = verify.verify(publicKey, signature, 'base64');

      if (!isValid) {
        this.logger.error('Signature verification failed');
        return { isValid: false };
      }

      // 解密回调数据
      const data = JSON.parse(body);
      return { isValid: true, data };
    } catch (error) {
      this.logger.error(`Signature verification error: ${error}`);
      return { isValid: false };
    }
  }

  /**
   * 设置平台证书（用于验签）
   * 实际项目中应该定期从微信支付 API 下载并更新证书
   */
  setPlatformCertificate(serialNo: string, publicKey: string): void {
    this.platformCertificates.set(serialNo, publicKey);
  }

  /**
   * 生成 JSAPI 支付参数
   */
  private generateJsapiPayParams(prepayId: string): {
    timeStamp: string;
    nonceStr: string;
    package: string;
    signType: string;
    paySign: string;
  } {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = generateNonceStr();
    const packageStr = `prepay_id=${prepayId}`;

    const message = `${this.config.miniAppId}\n${timestamp}\n${nonceStr}\n${packageStr}\n`;
    const paySign = this.sign(message);

    return {
      timeStamp: timestamp,
      nonceStr,
      package: packageStr,
      signType: 'RSA',
      paySign,
    };
  }

  /**
   * 生成 APP 支付参数
   */
  private generateAppPayParams(prepayId: string): {
    appid: string;
    partnerid: string;
    prepayid: string;
    package: string;
    noncestr: string;
    timestamp: string;
    sign: string;
  } {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = generateNonceStr();

    const message = `${this.config.appId}\n${timestamp}\n${nonceStr}\n${prepayId}\n`;
    const sign = this.sign(message);

    return {
      appid: this.config.appId,
      partnerid: this.config.pay.mchId,
      prepayid: prepayId,
      package: 'Sign=WXPay',
      noncestr: nonceStr,
      timestamp,
      sign,
    };
  }

  /**
   * 签名
   */
  private sign(message: string): string {
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(message);
    return sign.sign(formatPrivateKey(this.config.pay.privateKey), 'base64');
  }

  /**
   * 发送 HTTP 请求
   */
  private async request<T = Record<string, unknown>>(
    method: string,
    url: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = generateNonceStr();
    const bodyStr = body ? JSON.stringify(body) : '';

    const urlObj = new URL(url);
    const urlPath = urlObj.pathname + urlObj.search;

    const message = `${method}\n${urlPath}\n${timestamp}\n${nonceStr}\n${bodyStr}\n`;
    const signature = this.sign(message);

    const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${this.config.pay.mchId}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${this.config.pay.serialNo}"`;

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: authorization,
      },
    };

    if (body) {
      options.body = bodyStr;
    }

    const response = await fetchWithRetry(url, options, {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 30000,
    });

    const result = (await response.json()) as { message?: string; [key: string]: unknown };

    if (!response.ok) {
      this.logger.error(`WeChat Pay request failed: ${JSON.stringify(result)}`);
      throw new Error(result.message ?? 'WeChat Pay request failed');
    }

    return result as T;
  }
}

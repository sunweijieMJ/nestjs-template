import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import wechatConfig from './config/wechat.config';
import * as crypto from 'crypto';
import { formatPrivateKey, formatPublicKey, generateNonceStr } from '../../common/utils/crypto.utils';
import { fetchWithRetry } from '../../common/utils/http.utils';

interface WechatPaymentParams {
  openid?: string;
  outTradeNo: string;
  description: string;
  amount: number;
  /** 交易截止时间，过期后不可支付 */
  timeExpire?: Date;
}

interface WechatRefundParams {
  outTradeNo: string;
  outRefundNo: string;
  refundAmount: number;
  totalAmount: number;
  reason?: string;
}

/** 回调与平台证书中的加密数据（AES-256-GCM） */
export interface WechatEncryptedResource {
  ciphertext: string;
  nonce: string;
  associated_data?: string;
}

/** 支付或退款回调解密后的信息，支付通知带 trade_state，退款通知带 refund_status */
export interface WechatTransactionResource {
  mchid: string;
  out_trade_no: string;
  transaction_id: string;
  trade_state?: string;
  refund_status?: string;
  out_refund_no?: string;
  amount: { total: number; payer_total: number; refund?: number };
}

/** 微信支付公钥 ID 的前缀，回调序列号以此开头时使用公钥验签 */
const PUBLIC_KEY_ID_PREFIX = 'PUB_KEY_ID_';

function toRfc3339(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, '+00:00');
}

/** 平台证书刷新的最小间隔，避免伪造的证书序列号触发频繁下载 */
const CERTIFICATE_REFRESH_INTERVAL_MS = 60_000;

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
export class WechatPayService implements OnModuleInit {
  private readonly logger = new Logger(WechatPayService.name);
  private platformCertificates: Map<string, string> = new Map();
  private lastCertificateRefresh = 0;

  constructor(
    @Inject(wechatConfig.KEY)
    private readonly config: ConfigType<typeof wechatConfig>,
  ) {}

  /**
   * 加载微信支付公钥，并在后台下载平台证书，两种验签方式并存
   */
  onModuleInit(): void {
    const { publicKeyId, publicKey } = this.config.pay;
    if (publicKeyId && publicKey) {
      this.platformCertificates.set(publicKeyId, formatPublicKey(publicKey));
    }

    if (this.canDownloadCertificates()) {
      void this.refreshPlatformCertificates();
    }
  }

  /**
   * 下载平台证书并缓存其公钥，失败时只记录日志
   */
  async refreshPlatformCertificates(): Promise<void> {
    this.lastCertificateRefresh = Date.now();
    try {
      const result = await this.request<{
        data: { serial_no: string; encrypt_certificate: WechatEncryptedResource }[];
      }>('GET', 'https://api.mch.weixin.qq.com/v3/certificates');

      for (const item of result.data) {
        const certificate = this.decryptResource(item.encrypt_certificate);
        const publicKey = new crypto.X509Certificate(certificate).publicKey.export({ type: 'spki', format: 'pem' });
        this.platformCertificates.set(item.serial_no, publicKey.toString());
      }
      this.logger.log(`Loaded ${result.data.length} WeChat Pay platform certificates`);
    } catch (error) {
      this.logger.warn(`Failed to download WeChat Pay platform certificates: ${error}`);
    }
  }

  /**
   * 解密回调或平台证书中的加密数据
   */
  decryptResource(resource: WechatEncryptedResource): string {
    const data = Buffer.from(resource.ciphertext, 'base64');
    const authTag = data.subarray(data.length - 16);
    const encrypted = data.subarray(0, data.length - 16);

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(this.config.pay.apiV3Key, 'utf8'),
      resource.nonce,
    );
    decipher.setAuthTag(authTag);
    decipher.setAAD(Buffer.from(resource.associated_data ?? '', 'utf8'));

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }

  /**
   * 解密支付回调的交易信息，商户号不匹配时抛错
   */
  parseTransactionResource(resource: WechatEncryptedResource): WechatTransactionResource {
    const transaction = JSON.parse(this.decryptResource(resource)) as WechatTransactionResource;
    if (transaction.mchid !== this.config.pay.mchId) {
      throw new Error(`Unexpected mchid in notification: ${transaction.mchid}`);
    }
    return transaction;
  }

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
      time_expire: params.timeExpire ? toRfc3339(params.timeExpire) : undefined,
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
      time_expire: params.timeExpire ? toRfc3339(params.timeExpire) : undefined,
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
    const url = `https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/${encodeURIComponent(outTradeNo)}?mchid=${encodeURIComponent(this.config.pay.mchId)}`;
    return this.request('GET', url);
  }

  /**
   * 关闭订单
   */
  async closeOrder(outTradeNo: string): Promise<void> {
    const url = `https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/${encodeURIComponent(outTradeNo)}/close`;
    await this.request('POST', url, { mchid: this.config.pay.mchId });
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
      notify_url: this.config.pay.notifyUrl,
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
  async verifyNotify(
    headers: Record<string, string>,
    body: string,
  ): Promise<{ isValid: boolean; data?: Record<string, unknown> }> {
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

    // 获取平台证书公钥，未命中时按间隔重新下载平台证书
    let publicKey = this.platformCertificates.get(serial);
    if (
      !publicKey &&
      !serial.startsWith(PUBLIC_KEY_ID_PREFIX) &&
      this.canDownloadCertificates() &&
      Date.now() - this.lastCertificateRefresh > CERTIFICATE_REFRESH_INTERVAL_MS
    ) {
      await this.refreshPlatformCertificates();
      publicKey = this.platformCertificates.get(serial);
    }
    if (!publicKey) {
      this.logger.error(
        `Platform certificate not found for serial: ${serial}. Please download and cache platform certificates first.`,
      );
      return { isValid: false };
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
   * 设置平台证书公钥（用于验签）
   */
  setPlatformCertificate(serialNo: string, publicKey: string): void {
    this.platformCertificates.set(serialNo, publicKey);
  }

  private canDownloadCertificates(): boolean {
    const { mchId, apiV3Key, privateKey, serialNo } = this.config.pay;
    return Boolean(mchId && apiV3Key && privateKey && serialNo);
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

    if (response.status === 204) {
      return {} as T;
    }

    const result = (await response.json()) as { message?: string; [key: string]: unknown };

    if (!response.ok) {
      this.logger.error(`WeChat Pay request failed: ${JSON.stringify(result)}`);
      throw new Error(result.message ?? 'WeChat Pay request failed');
    }

    return result as T;
  }
}

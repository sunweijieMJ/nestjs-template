import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import qqConfig from './config/qq.config';
import * as crypto from 'crypto';
import { generateNonceStr } from '../../common/utils/crypto.utils';
import { fetchWithRetry } from '../../common/utils/http.utils';

interface QqPaymentParams {
  openid?: string;
  outTradeNo: string;
  description: string;
  amount: number;
}

interface QqRefundParams {
  outTradeNo: string;
  outRefundNo: string;
  refundAmount: number;
  totalAmount: number;
  reason?: string;
}

interface QqPayResponse {
  retcode: string;
  retmsg: string;
  token_id?: string;
  prepay_id?: string;
}

interface QqOrderResponse {
  retcode: string;
  retmsg: string;
  trade_state?: string;
  transaction_id?: string;
  out_trade_no?: string;
  total_fee?: number;
}

/**
 * QQ钱包支付服务
 */
@Injectable()
export class QqPayService {
  private readonly logger = new Logger(QqPayService.name);

  constructor(
    @Inject(qqConfig.KEY)
    private readonly config: ConfigType<typeof qqConfig>,
  ) {}

  /**
   * 创建APP支付订单
   */
  async createAppPayment(params: QqPaymentParams): Promise<{
    appId: string;
    bargainorId: string;
    tokenId: string;
    nonce: string;
    timestamp: string;
    sig: string;
  }> {
    const url = 'https://qpay.qq.com/cgi-bin/pay/qpay_unified_order.cgi';

    const nonceStr = generateNonceStr();
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const body: Record<string, string> = {
      appid: this.config.appId,
      mch_id: this.config.pay.bargainorId,
      nonce_str: nonceStr,
      body: params.description,
      out_trade_no: params.outTradeNo,
      total_fee: params.amount.toString(),
      spbill_create_ip: '127.0.0.1',
      notify_url: this.config.pay.notifyUrl,
      trade_type: 'APP',
    };

    if (params.openid) {
      body.openid = params.openid;
    }

    body.sign = this.sign(body);

    const result = await this.request<QqPayResponse>(url, body);

    if (result.retcode !== '0') {
      this.logger.error(`QQ Pay create order failed: ${result.retcode} - ${result.retmsg}`);
      throw new Error(result.retmsg ?? 'QQ Pay create order failed');
    }

    // 生成APP支付参数
    const payParams: Record<string, string> = {
      appId: this.config.appId,
      bargainorId: this.config.pay.bargainorId,
      tokenId: result.token_id ?? '',
      nonce: nonceStr,
      pubAcc: '',
      sigType: 'HMAC-SHA1',
    };

    const sig = this.signForApp(payParams);

    return {
      appId: this.config.appId,
      bargainorId: this.config.pay.bargainorId,
      tokenId: result.token_id ?? '',
      nonce: nonceStr,
      timestamp,
      sig,
    };
  }

  /**
   * 创建H5支付订单
   */
  async createH5Payment(params: QqPaymentParams): Promise<{
    payUrl: string;
  }> {
    const url = 'https://qpay.qq.com/cgi-bin/pay/qpay_unified_order.cgi';

    const nonceStr = generateNonceStr();

    const body: Record<string, string> = {
      appid: this.config.appId,
      mch_id: this.config.pay.bargainorId,
      nonce_str: nonceStr,
      body: params.description,
      out_trade_no: params.outTradeNo,
      total_fee: params.amount.toString(),
      spbill_create_ip: '127.0.0.1',
      notify_url: this.config.pay.notifyUrl,
      trade_type: 'H5',
    };

    body.sign = this.sign(body);

    const result = await this.request<QqPayResponse & { code_url?: string }>(url, body);

    if (result.retcode !== '0') {
      this.logger.error(`QQ Pay create H5 order failed: ${result.retcode} - ${result.retmsg}`);
      throw new Error(result.retmsg ?? 'QQ Pay create H5 order failed');
    }

    return {
      payUrl: result.code_url ?? '',
    };
  }

  /**
   * 查询订单
   */
  async queryOrder(outTradeNo: string): Promise<QqOrderResponse> {
    const url = 'https://qpay.qq.com/cgi-bin/pay/qpay_order_query.cgi';

    const nonceStr = generateNonceStr();

    const body: Record<string, string> = {
      appid: this.config.appId,
      mch_id: this.config.pay.bargainorId,
      nonce_str: nonceStr,
      out_trade_no: outTradeNo,
    };

    body.sign = this.sign(body);

    return this.request<QqOrderResponse>(url, body);
  }

  /**
   * 申请退款
   */
  async refund(params: QqRefundParams): Promise<{
    refundId: string;
    outRefundNo: string;
    outTradeNo: string;
  }> {
    const url = 'https://qpay.qq.com/cgi-bin/pay/qpay_refund.cgi';

    const nonceStr = generateNonceStr();

    const body: Record<string, string> = {
      appid: this.config.appId,
      mch_id: this.config.pay.bargainorId,
      nonce_str: nonceStr,
      out_trade_no: params.outTradeNo,
      out_refund_no: params.outRefundNo,
      refund_fee: params.refundAmount.toString(),
      total_fee: params.totalAmount.toString(),
      op_user_id: this.config.pay.bargainorId,
    };

    if (params.reason) {
      body.refund_desc = params.reason;
    }

    body.sign = this.sign(body);

    const result = await this.request<{
      retcode: string;
      retmsg: string;
      refund_id?: string;
      out_refund_no?: string;
      out_trade_no?: string;
    }>(url, body);

    if (result.retcode !== '0') {
      this.logger.error(`QQ Pay refund failed: ${result.retcode} - ${result.retmsg}`);
      throw new Error(result.retmsg ?? 'QQ Pay refund failed');
    }

    return {
      refundId: result.refund_id ?? '',
      outRefundNo: result.out_refund_no ?? '',
      outTradeNo: result.out_trade_no ?? '',
    };
  }

  /**
   * 关闭订单
   */
  async closeOrder(outTradeNo: string): Promise<void> {
    const url = 'https://qpay.qq.com/cgi-bin/pay/qpay_close_order.cgi';

    const nonceStr = generateNonceStr();

    const body: Record<string, string> = {
      appid: this.config.appId,
      mch_id: this.config.pay.bargainorId,
      nonce_str: nonceStr,
      out_trade_no: outTradeNo,
    };

    body.sign = this.sign(body);

    const result = await this.request<{ retcode: string; retmsg: string }>(url, body);

    if (result.retcode !== '0') {
      this.logger.error(`QQ Pay close order failed: ${result.retcode} - ${result.retmsg}`);
      throw new Error(result.retmsg ?? 'QQ Pay close order failed');
    }
  }

  /**
   * 验证支付回调签名
   */
  verifyNotify(params: Record<string, string>): { isValid: boolean; data?: Record<string, string> } {
    const sign = params.sign;

    if (!sign) {
      this.logger.warn('Missing sign in notify params');
      return { isValid: false };
    }

    // 移除 sign
    const { sign: _, ...signParams } = params;

    // 验证签名
    const calculatedSign = this.sign(signParams);

    if (calculatedSign !== sign) {
      this.logger.error('Signature verification failed');
      return { isValid: false };
    }

    return { isValid: true, data: params };
  }

  /**
   * 签名（用于API请求）
   */
  private sign(params: Record<string, string>): string {
    // 1. 按参数名ASCII码排序
    const sortedKeys = Object.keys(params)
      .filter((key) => params[key] !== '' && params[key] !== null && params[key] !== undefined && key !== 'sign')
      .sort();

    // 2. 拼接字符串
    const signStr = sortedKeys.map((key) => `${key}=${params[key]}`).join('&');

    // 3. 拼接密钥
    const stringSignTemp = `${signStr}&key=${this.config.pay.appKey}`;

    // 4. MD5加密并转大写
    return crypto.createHash('md5').update(stringSignTemp, 'utf8').digest('hex').toUpperCase();
  }

  /**
   * APP支付签名（HMAC-SHA1）
   */
  private signForApp(params: Record<string, string>): string {
    const sortedKeys = Object.keys(params)
      .filter((key) => params[key] !== '' && key !== 'sigType')
      .sort();

    const signStr = sortedKeys.map((key) => `${key}=${params[key]}`).join('&');

    // 使用HMAC-SHA1签名
    const hmac = crypto.createHmac('sha1', this.config.pay.appKey);
    hmac.update(signStr);
    return hmac.digest('base64');
  }

  /**
   * 发送HTTP请求
   */
  private async request<T = Record<string, unknown>>(url: string, body: Record<string, string>): Promise<T> {
    // 转换为XML格式
    const xmlBody = this.toXml(body);

    const response = await fetchWithRetry(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
        },
        body: xmlBody,
      },
      {
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 30000,
      },
    );

    const text = await response.text();
    return this.parseXml<T>(text);
  }

  /**
   * 对象转XML
   */
  private toXml(obj: Record<string, string>): string {
    const items = Object.keys(obj)
      .map((key) => `<${key}><![CDATA[${obj[key]}]]></${key}>`)
      .join('');
    return `<xml>${items}</xml>`;
  }

  /**
   * XML转对象
   */
  private parseXml<T>(xml: string): T {
    const result: Record<string, string> = {};
    const regex = /<(\w+)><!\[CDATA\[(.*?)\]\]><\/\1>|<(\w+)>(.*?)<\/\3>/g;
    let match;

    while ((match = regex.exec(xml)) !== null) {
      const key = match[1] || match[3];
      const value = match[2] || match[4];
      result[key] = value;
    }

    return result as T;
  }
}

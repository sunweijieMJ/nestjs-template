import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import alipayConfig from './config/alipay.config';
import * as crypto from 'crypto';
import { formatPrivateKey, formatPublicKey, escapeHtml } from '../../common/utils/crypto.utils';
import { fetchWithRetry } from '../../common/utils/http.utils';

interface AlipayCommonResponse {
  code: string;
  msg: string;
  sub_code?: string;
  sub_msg?: string;
}

/**
 * 支付宝服务（支付 + 登录）
 */
@Injectable()
export class AlipayService {
  private readonly logger = new Logger(AlipayService.name);

  constructor(
    @Inject(alipayConfig.KEY)
    private readonly config: ConfigType<typeof alipayConfig>,
  ) {}

  /**
   * 获取支付宝授权登录 URL
   */
  getAuthUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      app_id: this.config.appId,
      scope: 'auth_user',
      redirect_uri: redirectUri,
      state: state ?? '',
    });

    return `https://openauth.alipay.com/oauth2/publicAppAuthorize.htm?${params.toString()}`;
  }

  /**
   * 通过授权码获取访问令牌
   */
  async getAccessToken(authCode: string): Promise<{
    access_token: string;
    user_id: string;
    expires_in: number;
  }> {
    const bizContent = {
      grant_type: 'authorization_code',
      code: authCode,
    };

    const params = this.buildCommonParams('alipay.system.oauth.token', bizContent);
    const sign = this.sign(params);
    params.sign = sign;

    const response = await this.sendRequest<{
      alipay_system_oauth_token_response: {
        access_token: string;
        user_id: string;
        expires_in: number;
      } & AlipayCommonResponse;
    }>(params);

    return response.alipay_system_oauth_token_response;
  }

  /**
   * 获取支付宝用户信息
   */
  async getUserInfo(accessToken: string): Promise<{
    user_id: string;
    nick_name: string;
    avatar: string;
  }> {
    const params: Record<string, string> = {
      app_id: this.config.appId,
      method: 'alipay.user.info.share',
      format: 'JSON',
      charset: this.config.charset,
      sign_type: this.config.signType,
      timestamp: this.getTimestamp(),
      version: '1.0',
      auth_token: accessToken,
    };

    const sign = this.sign(params);
    params.sign = sign;

    const response = await this.sendRequest<{
      alipay_user_info_share_response: {
        user_id: string;
        nick_name: string;
        avatar: string;
      } & AlipayCommonResponse;
    }>(params);

    return response.alipay_user_info_share_response;
  }

  /**
   * 创建手机网站支付订单
   */
  createMobilePayment(params: { outTradeNo: string; subject: string; totalAmount: string; body?: string }): string {
    const bizContent = {
      out_trade_no: params.outTradeNo,
      product_code: 'QUICK_WAP_WAY',
      total_amount: params.totalAmount,
      subject: params.subject,
      body: params.body,
    };

    return this.buildRequestForm('alipay.trade.wap.pay', bizContent);
  }

  /**
   * 创建电脑网站支付订单
   */
  createWebPayment(params: { outTradeNo: string; subject: string; totalAmount: string; body?: string }): string {
    const bizContent = {
      out_trade_no: params.outTradeNo,
      product_code: 'FAST_INSTANT_TRADE_PAY',
      total_amount: params.totalAmount,
      subject: params.subject,
      body: params.body,
    };

    return this.buildRequestForm('alipay.trade.page.pay', bizContent);
  }

  /**
   * 查询订单状态
   */
  async queryOrder(outTradeNo: string): Promise<{
    trade_no: string;
    out_trade_no: string;
    trade_status: string;
    total_amount: string;
  }> {
    const bizContent = {
      out_trade_no: outTradeNo,
    };

    const params = this.buildCommonParams('alipay.trade.query', bizContent);
    const sign = this.sign(params);
    params.sign = sign;

    const response = await this.sendRequest<{
      alipay_trade_query_response: {
        trade_no: string;
        out_trade_no: string;
        trade_status: string;
        total_amount: string;
      } & AlipayCommonResponse;
    }>(params);

    return response.alipay_trade_query_response;
  }

  /**
   * 关闭订单
   */
  async closeOrder(outTradeNo: string): Promise<{
    trade_no: string;
    out_trade_no: string;
  }> {
    const bizContent = {
      out_trade_no: outTradeNo,
    };

    const params = this.buildCommonParams('alipay.trade.close', bizContent);
    const sign = this.sign(params);
    params.sign = sign;

    const response = await this.sendRequest<{
      alipay_trade_close_response: {
        trade_no: string;
        out_trade_no: string;
      } & AlipayCommonResponse;
    }>(params);

    return response.alipay_trade_close_response;
  }

  /**
   * 退款
   */
  async refund(params: { outTradeNo: string; refundAmount: string; refundReason?: string }): Promise<{
    trade_no: string;
    out_trade_no: string;
    refund_fee: string;
  }> {
    const bizContent = {
      out_trade_no: params.outTradeNo,
      refund_amount: params.refundAmount,
      refund_reason: params.refundReason,
    };

    const requestParams = this.buildCommonParams('alipay.trade.refund', bizContent);
    const sign = this.sign(requestParams);
    requestParams.sign = sign;

    const response = await this.sendRequest<{
      alipay_trade_refund_response: {
        trade_no: string;
        out_trade_no: string;
        refund_fee: string;
      } & AlipayCommonResponse;
    }>(requestParams);

    return response.alipay_trade_refund_response;
  }

  /**
   * 验证支付宝回调签名
   */
  verifyNotify(params: Record<string, string>): boolean {
    const sign = params.sign;
    const signType = params.sign_type;

    if (!sign || !signType) {
      return false;
    }

    // 移除 sign 和 sign_type
    const { sign: _, sign_type: __, ...signParams } = params;

    // 生成待验签字符串
    const signStr = this.buildSignString(signParams);

    // 验证签名
    const verify = crypto.createVerify(signType === 'RSA2' ? 'RSA-SHA256' : 'RSA-SHA1');
    verify.update(signStr, 'utf-8');

    return verify.verify(formatPublicKey(this.config.alipayPublicKey), sign, 'base64');
  }

  /**
   * 构建公共请求参数
   */
  private buildCommonParams(method: string, bizContent: Record<string, unknown>): Record<string, string> {
    return {
      app_id: this.config.appId,
      method,
      format: 'JSON',
      charset: this.config.charset,
      sign_type: this.config.signType,
      timestamp: this.getTimestamp(),
      version: '1.0',
      notify_url: this.config.notifyUrl,
      biz_content: JSON.stringify(bizContent),
    };
  }

  /**
   * 构建请求表单（用于页面支付）
   */
  private buildRequestForm(method: string, bizContent: Record<string, unknown>): string {
    const params: Record<string, string> = {
      ...this.buildCommonParams(method, bizContent),
      return_url: this.config.returnUrl,
    };

    const sign = this.sign(params);
    params.sign = sign;

    const formItems = Object.keys(params)
      .map((key) => `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(params[key])}"/>`)
      .join('\n');

    return `<form id="alipaysubmit" name="alipaysubmit" action="${escapeHtml(this.config.gateway)}" method="POST">
      ${formItems}
      <script>document.forms['alipaysubmit'].submit();</script>
    </form>`;
  }

  /**
   * 签名
   */
  private sign(params: Record<string, string>): string {
    const signStr = this.buildSignString(params);
    const sign = crypto.createSign(this.config.signType === 'RSA2' ? 'RSA-SHA256' : 'RSA-SHA1');
    sign.update(signStr, 'utf-8');
    return sign.sign(formatPrivateKey(this.config.privateKey), 'base64');
  }

  /**
   * 构建待签名字符串
   */
  private buildSignString(params: Record<string, string>): string {
    return Object.keys(params)
      .filter((key) => params[key] !== '' && params[key] !== null && params[key] !== undefined)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');
  }

  /**
   * 发送 HTTP 请求到支付宝网关
   */
  private async sendRequest<T>(params: Record<string, string>): Promise<T> {
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.config.gateway}?${queryString}`;

    const response = await fetchWithRetry(
      url,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
      {
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 30000,
      },
    );

    if (!response.ok) {
      this.logger.error(`Alipay request failed: ${response.statusText}`);
      throw new Error('Alipay request failed');
    }

    const result = (await response.json()) as T;
    return result;
  }

  /**
   * 获取时间戳
   */
  private getTimestamp(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * 获取支付宝分享配置
   */
  getShareConfig(params: { title: string; description: string; image: string; path: string }): {
    title: string;
    description: string;
    image: string;
    path: string;
  } {
    return {
      title: params.title,
      description: params.description,
      image: params.image,
      path: params.path,
    };
  }
}

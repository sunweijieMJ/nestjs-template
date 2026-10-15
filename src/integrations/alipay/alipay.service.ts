import { Injectable, Inject, Logger, HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
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

export interface AlipayPaymentParams {
  outTradeNo: string;
  subject: string;
  /** 金额（元） */
  totalAmount: string;
  body?: string;
  /** 交易截止时间，过期后不可支付 */
  timeExpire?: Date;
  /** 追加到 return_url 的查询参数（仅网页支付） */
  returnQuery?: Record<string, string>;
}

/** 在 URL 的 # 之前追加查询参数，URL 为空时返回空串 */
function appendQuery(url: string, query?: Record<string, string>): string {
  if (!url || !query || Object.keys(query).length === 0) return url;
  const hashIndex = url.indexOf('#');
  const base = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : url.slice(hashIndex);
  return `${base}${base.includes('?') ? '&' : '?'}${new URLSearchParams(query).toString()}${hash}`;
}

const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;

/** 同一订单号再次下单但交易信息（金额、付款人、标题等）不一致 */
const TRADE_CONTEXT_INCONSISTENT = 'ACQ.CONTEXT_INCONSISTENT';

interface AlipayOauthTokenResponse {
  alipay_system_oauth_token_response?: {
    open_id?: string;
    user_id?: string;
    access_token: string;
    expires_in: number;
  };
  error_response?: AlipayCommonResponse;
}

/** 支付宝要求的 yyyy-MM-dd HH:mm:ss（北京时间） */
function toBeijingTime(date: Date): string {
  return new Date(date.getTime() + BEIJING_OFFSET_MS).toISOString().slice(0, 19).replace('T', ' ');
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
   * 用小程序 my.getAuthCode 返回的授权码换取用户标识
   * @returns open_id；应用未开启 OpenID（只返回 user_id）时视为配置错误
   * @throws UnprocessableEntityException 授权码无效时为 invalidAlipayAuthCode，未配置或请求失败时为 alipay 字段错误
   */
  async exchangeAuthCode(authCode: string): Promise<{ openId: string }> {
    if (!this.config.appId || !this.config.privateKey) {
      this.logger.error('Alipay credentials not configured');
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { alipay: 'notConfigured' },
      });
    }

    const params: Record<string, string> = {
      app_id: this.config.appId,
      method: 'alipay.system.oauth.token',
      format: 'JSON',
      charset: this.config.charset,
      sign_type: this.config.signType,
      timestamp: toBeijingTime(new Date()),
      version: '1.0',
      grant_type: 'authorization_code',
      code: authCode,
    };
    params.sign = this.sign(params);

    let response: AlipayOauthTokenResponse;
    try {
      // 授权码只能使用一次，超时重试会因授权码已使用而失败
      response = await this.sendRequest<AlipayOauthTokenResponse>(params, { maxRetries: 0 });
    } catch (error) {
      this.logger.error('Alipay oauth token request failed', error);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { alipay: 'requestFailed' },
      });
    }

    const errorResponse = response.error_response;
    if (errorResponse) {
      this.logger.error(`Alipay oauth token failed: ${errorResponse.code} ${errorResponse.sub_code ?? ''}`);
      if (errorResponse.sub_code?.startsWith('isv.code-')) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          error: 'invalidAlipayAuthCode',
          errors: { authCode: 'invalidCode' },
        });
      }
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { alipay: 'requestFailed' },
      });
    }

    const token = response.alipay_system_oauth_token_response;
    const openId = token?.open_id;
    if (!openId) {
      this.logger.error('Alipay oauth token response has no open_id, check that OpenID is enabled for the app');
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { alipay: 'requestFailed' },
      });
    }

    return { openId };
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
      timestamp: toBeijingTime(new Date()),
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
  createMobilePayment(params: AlipayPaymentParams): string {
    const bizContent = {
      out_trade_no: params.outTradeNo,
      product_code: 'QUICK_WAP_WAY',
      total_amount: params.totalAmount,
      subject: params.subject,
      body: params.body,
      time_expire: params.timeExpire ? toBeijingTime(params.timeExpire) : undefined,
    };

    return this.buildRequestForm('alipay.trade.wap.pay', bizContent, params.returnQuery);
  }

  /**
   * 创建小程序支付订单（alipay.trade.create）
   * @param buyerOpenId - 付款用户的 open_id
   * @returns 支付宝交易号，供小程序 my.tradePay 拉起收银台
   * @throws UnprocessableEntityException 交易信息与该订单号已有交易不一致时为 alipayTradeInconsistent，请求失败时为 alipay 字段错误
   */
  async createMiniProgramPayment(params: AlipayPaymentParams & { buyerOpenId: string }): Promise<string> {
    const bizContent = {
      out_trade_no: params.outTradeNo,
      product_code: 'JSAPI_PAY',
      total_amount: params.totalAmount,
      subject: params.subject,
      body: params.body,
      time_expire: params.timeExpire ? toBeijingTime(params.timeExpire) : undefined,
      buyer_open_id: params.buyerOpenId,
    };

    const requestParams = this.buildCommonParams('alipay.trade.create', bizContent);
    requestParams.sign = this.sign(requestParams);

    let response: {
      alipay_trade_create_response?: { trade_no: string; out_trade_no: string } & AlipayCommonResponse;
      error_response?: AlipayCommonResponse;
    };
    try {
      response = await this.sendRequest(requestParams);
    } catch (error) {
      this.logger.error('Alipay trade create request failed', error);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { alipay: 'requestFailed' },
      });
    }

    const result = response.alipay_trade_create_response ?? response.error_response;
    if (!result) {
      this.logger.error('Alipay trade create response is empty');
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { alipay: 'requestFailed' },
      });
    }

    if (result.sub_code === TRADE_CONTEXT_INCONSISTENT) {
      this.logger.warn(`Alipay trade context inconsistent for order ${params.outTradeNo}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        error: 'alipayTradeInconsistent',
        errors: { outTradeNo: 'tradeInconsistent' },
      });
    }

    return this.assertSuccess(result as { trade_no: string } & AlipayCommonResponse).trade_no;
  }

  /**
   * 创建电脑网站支付订单
   */
  createWebPayment(params: AlipayPaymentParams): string {
    const bizContent = {
      out_trade_no: params.outTradeNo,
      product_code: 'FAST_INSTANT_TRADE_PAY',
      total_amount: params.totalAmount,
      subject: params.subject,
      body: params.body,
      time_expire: params.timeExpire ? toBeijingTime(params.timeExpire) : undefined,
    };

    return this.buildRequestForm('alipay.trade.page.pay', bizContent, params.returnQuery);
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

    return this.assertSuccess(response.alipay_trade_query_response);
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

    return this.assertSuccess(response.alipay_trade_close_response);
  }

  /**
   * 退款
   */
  async refund(params: {
    outTradeNo: string;
    refundAmount: string;
    refundReason?: string;
    outRequestNo: string;
  }): Promise<{
    trade_no: string;
    out_trade_no: string;
    refund_fee: string;
  }> {
    const bizContent = {
      out_trade_no: params.outTradeNo,
      refund_amount: params.refundAmount,
      refund_reason: params.refundReason,
      out_request_no: params.outRequestNo,
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

    return this.assertSuccess(response.alipay_trade_refund_response);
  }

  /**
   * 验证支付宝回调签名，并要求回调属于本应用
   */
  verifyNotify(params: Record<string, string>): boolean {
    const sign = params.sign;
    const signType = params.sign_type;

    if (!sign || !signType || params.app_id !== this.config.appId) {
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
      timestamp: toBeijingTime(new Date()),
      version: '1.0',
      notify_url: this.config.notifyUrl,
      biz_content: JSON.stringify(bizContent),
    };
  }

  /**
   * 构建请求表单（用于页面支付）
   */
  private buildRequestForm(
    method: string,
    bizContent: Record<string, unknown>,
    returnQuery?: Record<string, string>,
  ): string {
    const params: Record<string, string> = {
      ...this.buildCommonParams(method, bizContent),
      return_url: appendQuery(this.config.returnUrl, returnQuery),
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
   * 业务返回码不是 10000 时抛出 422
   */
  private assertSuccess<T extends AlipayCommonResponse>(response: T): T {
    if (response.code !== '10000') {
      this.logger.error(`Alipay business error: ${response.code} ${response.sub_code ?? ''} ${response.sub_msg ?? ''}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          alipay: response.sub_msg ?? response.msg,
        },
      });
    }
    return response;
  }

  /**
   * 发送 HTTP 请求到支付宝网关
   */
  private async sendRequest<T>(params: Record<string, string>, retryOptions: { maxRetries?: number } = {}): Promise<T> {
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
        maxRetries: retryOptions.maxRetries ?? 3,
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

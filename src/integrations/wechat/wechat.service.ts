import { Injectable, Logger, UnprocessableEntityException, HttpStatus, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface WechatUserInfo {
  openId: string;
  unionId?: string;
  sessionKey?: string;
  nickname?: string;
  avatar?: string;
  gender?: number;
}

export interface WechatMiniLoginResult {
  openid: string;
  session_key: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

export interface WechatAppTokenResult {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  openid: string;
  scope: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

export interface WechatAppUserInfoResult {
  openid: string;
  nickname: string;
  sex: number;
  province: string;
  city: string;
  country: string;
  headimgurl: string;
  privilege: string[];
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

export interface WechatAccessTokenResult {
  access_token: string;
  expires_in: number;
  errcode?: number;
  errmsg?: string;
}

export interface WechatJsapiTicketResult {
  ticket: string;
  expires_in: number;
  errcode?: number;
  errmsg?: string;
}

@Injectable()
export class WechatService {
  private readonly logger = new Logger(WechatService.name);

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * 微信小程序登录 - 通过code换取openid和session_key
   */
  async miniAppLogin(code: string): Promise<WechatUserInfo> {
    const appId = this.configService.get('wechat.miniAppId', { infer: true });
    const appSecret = this.configService.get('wechat.miniAppSecret', { infer: true });

    if (!appId || !appSecret) {
      this.logger.error('WeChat Mini App credentials not configured');
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          wechat: 'notConfigured',
        },
      });
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;

    try {
      const response = await fetch(url);
      const data = (await response.json()) as WechatMiniLoginResult;

      if (data.errcode) {
        this.logger.error(`WeChat Mini App login failed: ${data.errcode} - ${data.errmsg}`);
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            code: 'invalidCode',
            wechatError: data.errmsg,
          },
        });
      }

      this.logger.log(`WeChat Mini App login successful for openid: ${data.openid}`);

      return {
        openId: data.openid,
        unionId: data.unionid,
        sessionKey: data.session_key,
      };
    } catch (error) {
      if (error instanceof UnprocessableEntityException) {
        throw error;
      }
      this.logger.error('WeChat Mini App login request failed', error);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          wechat: 'requestFailed',
        },
      });
    }
  }

  /**
   * 微信APP登录 - 通过code换取access_token和openid
   */
  async appLogin(code: string): Promise<WechatUserInfo> {
    const appId = this.configService.get('wechat.appId', { infer: true });
    const appSecret = this.configService.get('wechat.appSecret', { infer: true });

    if (!appId || !appSecret) {
      this.logger.error('WeChat App credentials not configured');
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          wechat: 'notConfigured',
        },
      });
    }

    // Step 1: Exchange code for access_token
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`;

    try {
      const tokenResponse = await fetch(tokenUrl);
      const tokenData = (await tokenResponse.json()) as WechatAppTokenResult;

      if (tokenData.errcode) {
        this.logger.error(`WeChat App token exchange failed: ${tokenData.errcode} - ${tokenData.errmsg}`);
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            code: 'invalidCode',
            wechatError: tokenData.errmsg,
          },
        });
      }

      // Step 2: Get user info using access_token
      const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${tokenData.access_token}&openid=${tokenData.openid}`;
      const userInfoResponse = await fetch(userInfoUrl);
      const userInfoData = (await userInfoResponse.json()) as WechatAppUserInfoResult;

      if (userInfoData.errcode) {
        this.logger.error(`WeChat App user info failed: ${userInfoData.errcode} - ${userInfoData.errmsg}`);
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            wechat: 'userInfoFailed',
            wechatError: userInfoData.errmsg,
          },
        });
      }

      this.logger.log(`WeChat App login successful for openid: ${tokenData.openid}`);

      return {
        openId: tokenData.openid,
        unionId: userInfoData.unionid ?? tokenData.unionid,
        nickname: userInfoData.nickname,
        avatar: userInfoData.headimgurl,
        gender: userInfoData.sex,
      };
    } catch (error) {
      if (error instanceof UnprocessableEntityException) {
        throw error;
      }
      this.logger.error('WeChat App login request failed', error);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          wechat: 'requestFailed',
        },
      });
    }
  }

  /**
   * 获取微信公众号 access_token（带缓存）
   */
  async getAccessToken(): Promise<string> {
    const cacheKey = 'wechat:access_token';
    const cached = await this.cacheManager.get<string>(cacheKey);

    if (cached) {
      return cached;
    }

    const appId = this.configService.get('wechat.appId', { infer: true });
    const appSecret = this.configService.get('wechat.appSecret', { infer: true });

    if (!appId || !appSecret) {
      this.logger.error('WeChat credentials not configured');
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          wechat: 'notConfigured',
        },
      });
    }

    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;

    try {
      const response = await fetch(url);
      const data = (await response.json()) as WechatAccessTokenResult;

      if (data.errcode) {
        this.logger.error(`Get access_token failed: ${data.errcode} - ${data.errmsg}`);
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            wechat: 'accessTokenFailed',
            wechatError: data.errmsg,
          },
        });
      }

      // Cache for 7000 seconds (expires_in is 7200, use 7000 for safety)
      await this.cacheManager.set(cacheKey, data.access_token, 7000 * 1000);

      return data.access_token;
    } catch (error) {
      if (error instanceof UnprocessableEntityException) {
        throw error;
      }
      this.logger.error('Get access_token request failed', error);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          wechat: 'requestFailed',
        },
      });
    }
  }

  /**
   * 获取微信 jsapi_ticket（带缓存）
   */
  async getJsapiTicket(): Promise<string> {
    const cacheKey = 'wechat:jsapi_ticket';
    const cached = await this.cacheManager.get<string>(cacheKey);

    if (cached) {
      return cached;
    }

    const accessToken = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`;

    try {
      const response = await fetch(url);
      const data = (await response.json()) as WechatJsapiTicketResult;

      if (data.errcode && data.errcode !== 0) {
        this.logger.error(`Get jsapi_ticket failed: ${data.errcode} - ${data.errmsg}`);
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            wechat: 'jsapiTicketFailed',
            wechatError: data.errmsg,
          },
        });
      }

      // Cache for 7000 seconds (expires_in is 7200, use 7000 for safety)
      await this.cacheManager.set(cacheKey, data.ticket, 7000 * 1000);

      return data.ticket;
    } catch (error) {
      if (error instanceof UnprocessableEntityException) {
        throw error;
      }
      this.logger.error('Get jsapi_ticket request failed', error);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          wechat: 'requestFailed',
        },
      });
    }
  }

  /**
   * 获取微信 JS-SDK 配置
   */
  async getJsSdkConfig(url: string): Promise<{
    appId: string;
    timestamp: string;
    nonceStr: string;
    signature: string;
  }> {
    const appId = this.configService.get('wechat.appId', { infer: true });

    if (!appId) {
      this.logger.error('WeChat App ID not configured');
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          wechat: 'notConfigured',
        },
      });
    }

    const jsapiTicket = await this.getJsapiTicket();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = this.generateNonceStr();

    // Import signature utility
    const { generateWeChatSignature } = await import('../../modules/shares/utils/wechat-signature.util');
    const signature = generateWeChatSignature(jsapiTicket, nonceStr, timestamp, url);

    return {
      appId,
      timestamp,
      nonceStr,
      signature,
    };
  }

  /**
   * 生成随机字符串
   */
  private generateNonceStr(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

import { Injectable, Logger, UnprocessableEntityException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../config/config.type';

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

@Injectable()
export class WechatService {
  private readonly logger = new Logger(WechatService.name);

  constructor(private readonly configService: ConfigService<AllConfigType>) {}

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
}

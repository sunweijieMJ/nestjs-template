import { Injectable, Logger, UnprocessableEntityException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';

export interface QqUserInfo {
  openId: string;
  unionId?: string;
  nickname?: string;
  avatar?: string;
  gender?: number;
}

export interface QqAccessTokenResult {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  error?: number;
  error_description?: string;
}

export interface QqOpenIdResult {
  client_id: string;
  openid: string;
  unionid?: string;
  error?: number;
  error_description?: string;
}

export interface QqUserInfoResult {
  ret: number;
  msg: string;
  nickname: string;
  figureurl_qq_1: string;
  figureurl_qq_2: string;
  gender: string;
  gender_type: number;
}

export interface QqMiniLoginResult {
  openid: string;
  session_key: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

@Injectable()
export class QqService {
  private readonly logger = new Logger(QqService.name);

  constructor(private readonly configService: ConfigService<AllConfigType>) {}

  /**
   * QQ登录 - 通过code换取用户信息
   * @param code - QQ授权码
   * @param redirectUri - 回调地址（与获取code时使用的地址一致）
   */
  async login(code: string, redirectUri: string): Promise<QqUserInfo> {
    const appId = this.configService.get('qq.appId', { infer: true });
    const appKey = this.configService.get('qq.appKey', { infer: true });

    if (!appId || !appKey) {
      this.logger.error('QQ credentials not configured');
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          qq: 'notConfigured',
        },
      });
    }

    // Step 1: Exchange code for access_token
    const tokenUrl = `https://graph.qq.com/oauth2.0/token?grant_type=authorization_code&client_id=${appId}&client_secret=${appKey}&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}&fmt=json`;

    try {
      const tokenResponse = await fetch(tokenUrl);

      if (!tokenResponse.ok) {
        this.logger.error(`QQ token HTTP error: ${tokenResponse.status} ${tokenResponse.statusText}`);
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            qq: 'requestFailed',
          },
        });
      }

      const tokenData = (await tokenResponse.json()) as QqAccessTokenResult;

      if (tokenData.error) {
        this.logger.error(`QQ token exchange failed: ${tokenData.error} - ${tokenData.error_description}`);
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            code: 'invalidCode',
            qqError: tokenData.error_description,
          },
        });
      }

      // Step 2: Get openid and unionid using access_token (添加unionid=1参数获取unionid)
      const openIdUrl = `https://graph.qq.com/oauth2.0/me?access_token=${tokenData.access_token}&unionid=1&fmt=json`;
      const openIdResponse = await fetch(openIdUrl);

      if (!openIdResponse.ok) {
        this.logger.error(`QQ openid HTTP error: ${openIdResponse.status} ${openIdResponse.statusText}`);
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            qq: 'requestFailed',
          },
        });
      }

      const openIdData = (await openIdResponse.json()) as QqOpenIdResult;

      if (openIdData.error) {
        this.logger.error(`QQ openid failed: ${openIdData.error} - ${openIdData.error_description}`);
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            qq: 'openIdFailed',
            qqError: openIdData.error_description,
          },
        });
      }

      // Step 3: Get user info
      const userInfoUrl = `https://graph.qq.com/user/get_user_info?access_token=${tokenData.access_token}&oauth_consumer_key=${appId}&openid=${openIdData.openid}`;
      const userInfoResponse = await fetch(userInfoUrl);

      if (!userInfoResponse.ok) {
        this.logger.error(`QQ user info HTTP error: ${userInfoResponse.status} ${userInfoResponse.statusText}`);
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            qq: 'requestFailed',
          },
        });
      }

      const userInfoData = (await userInfoResponse.json()) as QqUserInfoResult;

      if (userInfoData.ret !== 0) {
        this.logger.error(`QQ user info failed: ${userInfoData.ret} - ${userInfoData.msg}`);
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            qq: 'userInfoFailed',
            qqError: userInfoData.msg,
          },
        });
      }

      this.logger.log(`QQ login successful for openid: ${openIdData.openid}`);

      return {
        openId: openIdData.openid,
        unionId: openIdData.unionid,
        nickname: userInfoData.nickname,
        avatar: userInfoData.figureurl_qq_2 || userInfoData.figureurl_qq_1,
        gender: this.convertGender(userInfoData.gender_type),
      };
    } catch (error) {
      if (error instanceof UnprocessableEntityException) {
        throw error;
      }
      this.logger.error('QQ login request failed', error);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          qq: 'requestFailed',
        },
      });
    }
  }

  /**
   * QQ APP登录 - 移动端SDK已获取access_token和openid的情况
   * @param accessToken - QQ access_token
   * @param openId - QQ openid
   * @param unionId - QQ unionid (可选，如果移动端SDK返回了unionid)
   */
  async appLogin(accessToken: string, openId: string, unionId?: string): Promise<QqUserInfo> {
    const appId = this.configService.get('qq.appId', { infer: true });

    if (!appId) {
      this.logger.error('QQ credentials not configured');
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          qq: 'notConfigured',
        },
      });
    }

    try {
      // Get user info directly using provided access_token and openid
      const userInfoUrl = `https://graph.qq.com/user/get_user_info?access_token=${accessToken}&oauth_consumer_key=${appId}&openid=${openId}`;
      const userInfoResponse = await fetch(userInfoUrl);

      if (!userInfoResponse.ok) {
        this.logger.error(`QQ user info HTTP error: ${userInfoResponse.status} ${userInfoResponse.statusText}`);
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            qq: 'requestFailed',
          },
        });
      }

      const userInfoData = (await userInfoResponse.json()) as QqUserInfoResult;

      if (userInfoData.ret !== 0) {
        this.logger.error(`QQ user info failed: ${userInfoData.ret} - ${userInfoData.msg}`);
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            qq: 'userInfoFailed',
            qqError: userInfoData.msg,
          },
        });
      }

      this.logger.log(`QQ APP login successful for openid: ${openId}`);

      return {
        openId: openId,
        unionId: unionId,
        nickname: userInfoData.nickname,
        avatar: userInfoData.figureurl_qq_2 || userInfoData.figureurl_qq_1,
        gender: this.convertGender(userInfoData.gender_type),
      };
    } catch (error) {
      if (error instanceof UnprocessableEntityException) {
        throw error;
      }
      this.logger.error('QQ APP login request failed', error);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          qq: 'requestFailed',
        },
      });
    }
  }

  /**
   * QQ小程序登录 - 通过code换取openid和session_key
   * @param code - QQ小程序授权码
   */
  async miniAppLogin(code: string): Promise<QqUserInfo> {
    const appId = this.configService.get('qq.miniAppId', { infer: true });
    const appSecret = this.configService.get('qq.miniAppSecret', { infer: true });

    if (!appId || !appSecret) {
      this.logger.error('QQ Mini App credentials not configured');
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          qq: 'notConfigured',
        },
      });
    }

    const url = `https://api.q.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        this.logger.error(`QQ Mini App login HTTP error: ${response.status} ${response.statusText}`);
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            qq: 'requestFailed',
          },
        });
      }

      const data = (await response.json()) as QqMiniLoginResult;

      if (data.errcode) {
        this.logger.error(`QQ Mini App login failed: ${data.errcode} - ${data.errmsg}`);
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            code: 'invalidCode',
            qqError: data.errmsg,
          },
        });
      }

      this.logger.log(`QQ Mini App login successful for openid: ${data.openid}`);

      return {
        openId: data.openid,
        unionId: data.unionid,
      };
    } catch (error) {
      if (error instanceof UnprocessableEntityException) {
        throw error;
      }
      this.logger.error('QQ Mini App login request failed', error);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          qq: 'requestFailed',
        },
      });
    }
  }

  /**
   * 转换性别类型
   * QQ: 1-男, 2-女, 0-未设置
   * 系统: 0-未知, 1-男, 2-女
   */
  private convertGender(genderType: number): number {
    if (genderType === 1) return 1; // 男
    if (genderType === 2) return 2; // 女
    return 0; // 未知
  }

  /**
   * 获取QQ分享配置
   * QQ分享不需要签名，直接返回分享参数即可
   */
  getShareConfig(params: { title: string; description: string; image: string; url: string }): {
    title: string;
    description: string;
    image: string;
    url: string;
  } {
    return {
      title: params.title,
      description: params.description,
      image: params.image,
      url: params.url,
    };
  }
}

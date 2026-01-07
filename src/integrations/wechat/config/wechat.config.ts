import { registerAs } from '@nestjs/config';
import { IsOptional, IsString } from 'class-validator';
import validateConfig from '../../../common/validate-config';
import { WechatConfig } from './wechat-config.type';

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  WECHAT_MINI_APP_ID: string;

  @IsString()
  @IsOptional()
  WECHAT_MINI_APP_SECRET: string;

  @IsString()
  @IsOptional()
  WECHAT_APP_ID: string;

  @IsString()
  @IsOptional()
  WECHAT_APP_SECRET: string;

  @IsString()
  @IsOptional()
  WECHAT_PAY_MCH_ID: string;

  @IsString()
  @IsOptional()
  WECHAT_PAY_API_V3_KEY: string;

  @IsString()
  @IsOptional()
  WECHAT_PAY_SERIAL_NO: string;

  @IsString()
  @IsOptional()
  WECHAT_PAY_PRIVATE_KEY: string;

  @IsString()
  @IsOptional()
  WECHAT_PAY_NOTIFY_URL: string;
}

export default registerAs<WechatConfig>('wechat', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    miniAppId: process.env.WECHAT_MINI_APP_ID ?? '',
    miniAppSecret: process.env.WECHAT_MINI_APP_SECRET ?? '',
    appId: process.env.WECHAT_APP_ID ?? '',
    appSecret: process.env.WECHAT_APP_SECRET ?? '',
    pay: {
      mchId: process.env.WECHAT_PAY_MCH_ID ?? '',
      apiV3Key: process.env.WECHAT_PAY_API_V3_KEY ?? '',
      serialNo: process.env.WECHAT_PAY_SERIAL_NO ?? '',
      privateKey: process.env.WECHAT_PAY_PRIVATE_KEY ?? '',
      notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL ?? '',
    },
  };
});

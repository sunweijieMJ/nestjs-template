import { registerAs } from '@nestjs/config';
import { IsOptional, IsString } from 'class-validator';
import validateConfig from '../../../common/validate-config';
import { QqConfig } from './qq-config.type';

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  QQ_APP_ID: string;

  @IsString()
  @IsOptional()
  QQ_APP_KEY: string;

  @IsString()
  @IsOptional()
  QQ_MINI_APP_ID: string;

  @IsString()
  @IsOptional()
  QQ_MINI_APP_SECRET: string;

  @IsString()
  @IsOptional()
  QQ_PAY_BARGAINOR_ID: string;

  @IsString()
  @IsOptional()
  QQ_PAY_APP_KEY: string;

  @IsString()
  @IsOptional()
  QQ_PAY_NOTIFY_URL: string;
}

export default registerAs<QqConfig>('qq', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    appId: process.env.QQ_APP_ID ?? '',
    appKey: process.env.QQ_APP_KEY ?? '',
    miniAppId: process.env.QQ_MINI_APP_ID ?? '',
    miniAppSecret: process.env.QQ_MINI_APP_SECRET ?? '',
    pay: {
      bargainorId: process.env.QQ_PAY_BARGAINOR_ID ?? '',
      appKey: process.env.QQ_PAY_APP_KEY ?? '',
      notifyUrl: process.env.QQ_PAY_NOTIFY_URL ?? '',
    },
  };
});

import { registerAs } from '@nestjs/config';
import { IsString, IsEnum, IsBoolean, IsOptional, IsUrl } from 'class-validator';
import validateConfig from '../../../common/validate-config';
import { AlipayConfig } from './alipay-config.type';
import { Transform } from 'class-transformer';

enum SignType {
  RSA2 = 'RSA2',
  RSA = 'RSA',
}

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  ALIPAY_APP_ID: string;

  @IsString()
  @IsOptional()
  ALIPAY_PRIVATE_KEY: string;

  @IsString()
  @IsOptional()
  ALIPAY_PUBLIC_KEY: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  ALIPAY_GATEWAY: string;

  @IsEnum(SignType)
  @IsOptional()
  ALIPAY_SIGN_TYPE: SignType;

  @IsString()
  @IsOptional()
  ALIPAY_CHARSET: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  ALIPAY_NOTIFY_URL: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  ALIPAY_RETURN_URL: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  ALIPAY_SANDBOX: boolean;
}

export default registerAs<AlipayConfig>('alipay', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  const sandbox = process.env.ALIPAY_SANDBOX === 'true';

  return {
    appId: process.env.ALIPAY_APP_ID ?? '',
    privateKey: process.env.ALIPAY_PRIVATE_KEY ?? '',
    alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY ?? '',
    gateway:
      process.env.ALIPAY_GATEWAY ??
      (sandbox ? 'https://openapi.alipaydev.com/gateway.do' : 'https://openapi.alipay.com/gateway.do'),
    signType: (process.env.ALIPAY_SIGN_TYPE as 'RSA2' | 'RSA') ?? 'RSA2',
    charset: process.env.ALIPAY_CHARSET ?? 'utf-8',
    notifyUrl: process.env.ALIPAY_NOTIFY_URL ?? '',
    returnUrl: process.env.ALIPAY_RETURN_URL ?? '',
    sandbox,
  };
});

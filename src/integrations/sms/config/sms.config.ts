import { registerAs } from '@nestjs/config';
import { IsString, IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import validateConfig from '../../../common/validate-config';
import { SmsConfig } from './sms-config.type';

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  SMS_ACCESS_KEY_ID: string;

  @IsString()
  @IsOptional()
  SMS_ACCESS_KEY_SECRET: string;

  @IsString()
  @IsOptional()
  SMS_SIGN_NAME: string;

  @IsString()
  @IsOptional()
  SMS_TEMPLATE_CODE: string;

  @IsNumber()
  @IsOptional()
  @Min(60)
  @Max(600)
  SMS_CODE_EXPIRES: number;

  @IsNumber()
  @IsOptional()
  @Min(4)
  @Max(8)
  SMS_CODE_LENGTH: number;

  @IsString()
  @IsOptional()
  SMS_ENDPOINT: string;

  @IsBoolean()
  @IsOptional()
  SMS_MOCK_MODE: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  SMS_MAX_ATTEMPTS: number;

  @IsNumber()
  @IsOptional()
  @Min(30)
  @Max(300)
  SMS_RESEND_INTERVAL: number;
}

export default registerAs<SmsConfig>('sms', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    accessKeyId: process.env.SMS_ACCESS_KEY_ID ?? '',
    accessKeySecret: process.env.SMS_ACCESS_KEY_SECRET ?? '',
    signName: process.env.SMS_SIGN_NAME ?? '',
    templateCode: process.env.SMS_TEMPLATE_CODE ?? '',
    codeExpires: process.env.SMS_CODE_EXPIRES ? parseInt(process.env.SMS_CODE_EXPIRES, 10) : 300,
    codeLength: process.env.SMS_CODE_LENGTH ? parseInt(process.env.SMS_CODE_LENGTH, 10) : 6,
    endpoint: process.env.SMS_ENDPOINT ?? 'dysmsapi.aliyuncs.com',
    mockMode: process.env.SMS_MOCK_MODE === 'true',
    maxAttempts: process.env.SMS_MAX_ATTEMPTS ? parseInt(process.env.SMS_MAX_ATTEMPTS, 10) : 5,
    resendInterval: process.env.SMS_RESEND_INTERVAL ? parseInt(process.env.SMS_RESEND_INTERVAL, 10) : 60,
  };
});

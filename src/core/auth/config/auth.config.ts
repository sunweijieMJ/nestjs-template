import { registerAs } from '@nestjs/config';

import { IsString } from 'class-validator';
import validateConfig from '../../../common/validate-config';
import { AuthConfig } from './auth-config.type';
import ms from 'ms';

const PRODUCTION_SECRET_MIN_LENGTH = 32;

const SECRET_NAMES = [
  'AUTH_JWT_SECRET',
  'AUTH_REFRESH_SECRET',
  'AUTH_FORGOT_SECRET',
  'AUTH_CONFIRM_EMAIL_SECRET',
] as const;

/** 生产环境要求密钥足够长且互不相同 */
function validateProductionSecrets(): void {
  const short = SECRET_NAMES.filter((name) => (process.env[name] ?? '').length < PRODUCTION_SECRET_MIN_LENGTH);
  if (short.length > 0) {
    throw new Error(`${short.join(', ')} must be at least ${PRODUCTION_SECRET_MIN_LENGTH} characters in production`);
  }
  if (new Set(SECRET_NAMES.map((name) => process.env[name])).size !== SECRET_NAMES.length) {
    throw new Error(`${SECRET_NAMES.join(', ')} must be different from each other in production`);
  }
}

class EnvironmentVariablesValidator {
  @IsString()
  AUTH_JWT_SECRET: string;

  @IsString()
  AUTH_JWT_TOKEN_EXPIRES_IN: string;

  @IsString()
  AUTH_REFRESH_SECRET: string;

  @IsString()
  AUTH_REFRESH_TOKEN_EXPIRES_IN: string;

  @IsString()
  AUTH_FORGOT_SECRET: string;

  @IsString()
  AUTH_FORGOT_TOKEN_EXPIRES_IN: string;

  @IsString()
  AUTH_CONFIRM_EMAIL_SECRET: string;

  @IsString()
  AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN: string;
}

export default registerAs<AuthConfig>('auth', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);
  if (process.env.NODE_ENV === 'production') {
    validateProductionSecrets();
  }

  return {
    secret: process.env.AUTH_JWT_SECRET,
    expires: process.env.AUTH_JWT_TOKEN_EXPIRES_IN as ms.StringValue,
    refreshSecret: process.env.AUTH_REFRESH_SECRET,
    refreshExpires: process.env.AUTH_REFRESH_TOKEN_EXPIRES_IN as ms.StringValue,
    forgotSecret: process.env.AUTH_FORGOT_SECRET,
    forgotExpires: process.env.AUTH_FORGOT_TOKEN_EXPIRES_IN as ms.StringValue,
    confirmEmailSecret: process.env.AUTH_CONFIRM_EMAIL_SECRET,
    confirmEmailExpires: process.env.AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN as ms.StringValue,
  };
});

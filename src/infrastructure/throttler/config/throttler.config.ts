import { registerAs } from '@nestjs/config';
import { IsBoolean, IsInt, Min } from 'class-validator';
import validateConfig from '../../../common/validate-config';
import { ThrottlerConfig } from './throttler-config.type';

class EnvironmentVariablesValidator {
  @IsInt()
  @Min(1)
  THROTTLE_TTL: number = 60;

  @IsInt()
  @Min(1)
  THROTTLE_LIMIT: number = 10;

  @IsBoolean()
  THROTTLE_ENABLED: boolean = true;
}

export default registerAs<ThrottlerConfig>('throttler', () => {
  const env = {
    THROTTLE_TTL: process.env.THROTTLE_TTL ? parseInt(process.env.THROTTLE_TTL, 10) : 60,
    THROTTLE_LIMIT: process.env.THROTTLE_LIMIT ? parseInt(process.env.THROTTLE_LIMIT, 10) : 10,
    THROTTLE_ENABLED: process.env.THROTTLE_ENABLED === 'true',
  };

  validateConfig(env, EnvironmentVariablesValidator);

  return {
    ttl: env.THROTTLE_TTL * 1000, // Convert to milliseconds
    limit: env.THROTTLE_LIMIT,
    enabled: env.THROTTLE_ENABLED,
  };
});

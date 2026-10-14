import { registerAs } from '@nestjs/config';
import { IsBoolean, IsString, MinLength, ValidateIf } from 'class-validator';
import validateConfig from '../../../common/validate-config';
import { MetricsConfig } from './metrics-config.type';

class EnvironmentVariablesValidator {
  @IsBoolean()
  METRICS_ENABLED: boolean = true;

  @IsString()
  METRICS_PATH: string = 'metrics';

  @ValidateIf((env: { METRICS_TOKEN?: string }) => !!env.METRICS_TOKEN)
  @IsString()
  @MinLength(16)
  METRICS_TOKEN?: string;
}

export default registerAs<MetricsConfig>('metrics', () => {
  const env = {
    METRICS_ENABLED: process.env.METRICS_ENABLED !== 'false',
    METRICS_PATH: process.env.METRICS_PATH ?? 'metrics',
    METRICS_TOKEN: process.env.METRICS_TOKEN,
  };

  validateConfig(env, EnvironmentVariablesValidator);

  return {
    enabled: env.METRICS_ENABLED,
    path: env.METRICS_PATH,
    token: env.METRICS_TOKEN,
    defaultLabels: {
      app: process.env.APP_NAME ?? 'nestjs-app',
    },
  };
});

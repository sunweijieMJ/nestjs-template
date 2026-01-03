import { registerAs } from '@nestjs/config';
import { IsBoolean, IsString } from 'class-validator';
import validateConfig from '../../../common/validate-config';
import { MetricsConfig } from './metrics-config.type';

class EnvironmentVariablesValidator {
  @IsBoolean()
  METRICS_ENABLED: boolean = true;

  @IsString()
  METRICS_PATH: string = 'metrics';
}

export default registerAs<MetricsConfig>('metrics', () => {
  const env = {
    METRICS_ENABLED: process.env.METRICS_ENABLED !== 'false',
    METRICS_PATH: process.env.METRICS_PATH ?? 'metrics',
  };

  validateConfig(env, EnvironmentVariablesValidator);

  return {
    enabled: env.METRICS_ENABLED,
    path: env.METRICS_PATH,
    defaultLabels: {
      app: process.env.APP_NAME ?? 'nestjs-app',
    },
  };
});

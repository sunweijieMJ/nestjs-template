import { AppConfig } from './app-config.type';
import { AuthConfig } from '../auth/config/auth-config.type';
import { DatabaseConfig } from '../database/config/database-config.type';
import { FileConfig } from '../files/config/file-config.type';
import { MailConfig } from '../mail/config/mail-config.type';
import { LoggerConfig } from '../logger/config/logger-config.type';
import { RedisConfig } from '../redis/config/redis-config.type';
import { ThrottlerConfig } from '../throttler/config/throttler-config.type';
import { MetricsConfig } from '../metrics/config/metrics-config.type';

export type AllConfigType = {
  app: AppConfig;
  auth: AuthConfig;
  database: DatabaseConfig;
  file: FileConfig;
  mail: MailConfig;
  logger: LoggerConfig;
  redis: RedisConfig;
  throttler: ThrottlerConfig;
  metrics: MetricsConfig;
};

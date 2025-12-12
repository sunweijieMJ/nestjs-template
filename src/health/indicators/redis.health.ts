import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private configService: ConfigService<AllConfigType>) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const redisEnabled = this.configService.get('redis.enabled', { infer: true });

    if (!redisEnabled) {
      return this.getStatus(key, true, { message: 'Redis disabled' });
    }

    const redisHost = this.configService.get('redis.host', { infer: true });
    const redisPort = this.configService.get('redis.port', { infer: true });
    const redisPassword = this.configService.get('redis.password', { infer: true });
    const redisDb = this.configService.get('redis.db', { infer: true });

    const redis = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword,
      db: redisDb,
      connectTimeout: 5000,
      lazyConnect: true,
    });

    try {
      await redis.connect();
      const pong = await redis.ping();
      await redis.quit();

      if (pong === 'PONG') {
        return this.getStatus(key, true);
      }

      throw new HealthCheckError('Redis ping failed', this.getStatus(key, false));
    } catch (error) {
      await redis.quit().catch(() => {});
      throw new HealthCheckError(
        'Redis health check failed',
        this.getStatus(key, false, {
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }
}

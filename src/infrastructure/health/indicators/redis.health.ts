import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../../config/config.type';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private configService: ConfigService<AllConfigType>,
    private healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const redisEnabled = this.configService.get('redis.enabled', { infer: true });

    if (!redisEnabled) {
      return indicator.up({ message: 'Redis disabled' });
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
        return indicator.up();
      }

      return indicator.down();
    } catch (error) {
      await redis.quit().catch(() => {});
      return indicator.down({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}

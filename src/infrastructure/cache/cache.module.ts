import { Global, Module, Logger } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import KeyvRedis, { Keyv } from '@keyv/redis';
import { AllConfigType } from '../../config/config.type';
import { CACHE_TTL_MS } from '../../common/constants/app.constants';

/** 缓存键前缀，与 BullMQ 等共用同一 Redis 时避免冲突 */
const CACHE_NAMESPACE = 'cache';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<AllConfigType>) => {
        const logger = new Logger('CacheModule');
        const redisEnabled = configService.get('redis.enabled', { infer: true });

        if (redisEnabled) {
          const redisHost = configService.get('redis.host', { infer: true });
          const redisPort = configService.get('redis.port', { infer: true });
          const redisPassword = configService.get('redis.password', { infer: true });
          const redisDb = configService.get('redis.db', { infer: true });

          try {
            logger.log(`Attempting to connect to Redis at ${redisHost}:${redisPort}`);
            const store = new KeyvRedis(
              {
                socket: {
                  host: redisHost,
                  port: redisPort,
                },
                password: redisPassword,
                database: redisDb,
                // 断连期间命令立即失败，调用方回退到数据库而不是等待重连
                disableOfflineQueue: true,
              },
              { namespace: CACHE_NAMESPACE, connectionTimeout: 5000, throwOnConnectError: true },
            );
            store.client.on('error', (error: Error) => {
              logger.warn(`Redis cache error: ${error.message}`);
            });
            await store.getClient();

            logger.log('Successfully connected to Redis cache');
            return {
              stores: [new Keyv(store, { namespace: CACHE_NAMESPACE, useKeyPrefix: false })],
              ttl: CACHE_TTL_MS,
            };
          } catch (error) {
            logger.warn(
              `Failed to connect to Redis: ${error instanceof Error ? error.message : 'Unknown error'}. Falling back to in-memory cache.`,
            );
            // Fallback to in-memory cache on Redis connection failure
            return {
              ttl: CACHE_TTL_MS,
            };
          }
        }

        logger.log('Redis disabled, using in-memory cache');
        // Fallback to in-memory cache
        return {
          ttl: CACHE_TTL_MS,
        };
      },
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}

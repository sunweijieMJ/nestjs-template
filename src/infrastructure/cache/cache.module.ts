import { Global, Module, Logger } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import { AllConfigType } from '../../config/config.type';
import { CACHE_TTL_MS } from '../../common/constants/app.constants';

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
            const store = await redisStore({
              socket: {
                host: redisHost,
                port: redisPort,
                connectTimeout: 5000, // 5 seconds connection timeout
              },
              password: redisPassword,
              database: redisDb,
            });

            logger.log('Successfully connected to Redis cache');
            return {
              store,
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

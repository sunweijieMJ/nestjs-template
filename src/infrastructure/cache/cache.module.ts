import { Global, Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import { AllConfigType } from '../../config/config.type';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<AllConfigType>) => {
        const redisEnabled = configService.get('redis.enabled', { infer: true });

        if (redisEnabled) {
          const redisHost = configService.get('redis.host', { infer: true });
          const redisPort = configService.get('redis.port', { infer: true });
          const redisPassword = configService.get('redis.password', { infer: true });
          const redisDb = configService.get('redis.db', { infer: true });

          return {
            store: await redisStore({
              socket: {
                host: redisHost,
                port: redisPort,
              },
              password: redisPassword,
              database: redisDb,
            }),
            ttl: 60 * 1000, // 60 seconds default TTL
          };
        }

        // Fallback to in-memory cache
        return {
          ttl: 60 * 1000,
        };
      },
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}

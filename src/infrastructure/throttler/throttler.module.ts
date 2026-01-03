import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule as NestThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';

@Global()
@Module({
  imports: [
    NestThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AllConfigType>) => {
        const enabled = configService.get('throttler.enabled', { infer: true });
        const ttl = configService.get('throttler.ttl', { infer: true }) ?? 60000;
        const limit = configService.get('throttler.limit', { infer: true }) ?? 10;

        if (!enabled) {
          return {
            throttlers: [{ ttl: 0, limit: 0 }],
            skipIf: () => true,
          };
        }

        return {
          throttlers: [
            {
              name: 'default',
              ttl,
              limit,
            },
          ],
        };
      },
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class ThrottlerModule {}

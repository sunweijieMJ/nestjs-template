import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AllConfigType } from '../config/config.type';
import { MailQueueModule } from './mail-queue/mail-queue.module';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AllConfigType>) => {
        const redisEnabled = configService.get('redis.enabled', { infer: true });

        if (!redisEnabled) {
          // Return empty config when Redis is disabled
          // Queues will not work but app won't crash
          return {
            connection: {
              host: 'localhost',
              port: 6379,
            },
          };
        }

        return {
          connection: {
            host: configService.get('redis.host', { infer: true }),
            port: configService.get('redis.port', { infer: true }),
            password: configService.get('redis.password', { infer: true }),
            db: configService.get('redis.db', { infer: true }),
          },
          defaultJobOptions: {
            removeOnComplete: 100,
            removeOnFail: 1000,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 1000,
            },
          },
        };
      },
    }),
    MailQueueModule,
  ],
  exports: [BullModule, MailQueueModule],
})
export class QueueModule {}

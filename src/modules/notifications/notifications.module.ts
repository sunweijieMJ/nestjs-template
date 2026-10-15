import { Module } from '@nestjs/common';
import { ConditionalModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { RelationalNotificationPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { NOTIFICATION_QUEUE } from '../../infrastructure/queue/notification-queue/notification-queue.constants';
import { isRedisEnabled } from '../../infrastructure/redis/config/redis.config';

@Module({
  imports: [
    RelationalNotificationPersistenceModule,
    ConditionalModule.registerWhen(BullModule.registerQueue({ name: NOTIFICATION_QUEUE }), isRedisEnabled),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService, RelationalNotificationPersistenceModule],
})
export class NotificationsModule {}

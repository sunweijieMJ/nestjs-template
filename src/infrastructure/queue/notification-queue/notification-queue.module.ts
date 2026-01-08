import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationQueueProcessor } from './notification-queue.processor';
import { NOTIFICATION_QUEUE } from './notification-queue.constants';
import { NotificationEntity } from '../../../modules/notifications/infrastructure/persistence/relational/entities/notification.entity';
import { UserEntity } from '../../../core/users/infrastructure/persistence/relational/entities/user.entity';
import { MailerModule } from '../../../integrations/mail/mailer.module';
import { SmsModule } from '../../../integrations/sms/sms.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: NOTIFICATION_QUEUE,
    }),
    TypeOrmModule.forFeature([NotificationEntity, UserEntity]),
    MailerModule,
    SmsModule,
  ],
  providers: [NotificationQueueProcessor],
  exports: [NotificationQueueProcessor],
})
export class NotificationQueueModule {}

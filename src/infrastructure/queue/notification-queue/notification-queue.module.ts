import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationQueueProcessor } from './notification-queue.processor';
import { NOTIFICATION_QUEUE } from './notification-queue.constants';
import { UsersModule } from '../../../core/users/users.module';
import { NotificationsModule } from '../../../modules/notifications/notifications.module';
import { MailerModule } from '../../../integrations/mail/mailer.module';
import { SmsModule } from '../../../integrations/sms/sms.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: NOTIFICATION_QUEUE,
    }),
    UsersModule,
    NotificationsModule,
    MailerModule,
    SmsModule,
  ],
  providers: [NotificationQueueProcessor],
  exports: [NotificationQueueProcessor],
})
export class NotificationQueueModule {}

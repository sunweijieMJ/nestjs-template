import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MailQueueProcessor } from './mail-queue.processor';
import { MailQueueService } from './mail-queue.service';
import { MailerModule } from '../../mailer/mailer.module';
import { ConfigModule } from '@nestjs/config';

export const MAIL_QUEUE = 'mail';

@Module({
  imports: [
    BullModule.registerQueue({
      name: MAIL_QUEUE,
    }),
    forwardRef(() => MailerModule),
    ConfigModule,
  ],
  providers: [MailQueueProcessor, MailQueueService],
  exports: [MailQueueService],
})
export class MailQueueModule {}

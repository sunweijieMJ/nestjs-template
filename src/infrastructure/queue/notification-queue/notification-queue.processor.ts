import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bullmq';
import { NOTIFICATION_QUEUE } from './notification-queue.constants';
import { MailerService } from '../../../integrations/mail/mailer.service';
import { AliyunSmsProvider } from '../../../integrations/sms/providers/aliyun-sms.provider';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from '../../../modules/notifications/infrastructure/persistence/relational/entities/notification.entity';
import { UserEntity } from '../../../core/users/infrastructure/persistence/relational/entities/user.entity';

interface EmailJobData {
  notificationId: number;
  userId: number;
  title: string;
  content: string;
}

interface SmsJobData {
  notificationId: number;
  userId: number;
  content: string;
}

@Processor(NOTIFICATION_QUEUE, {
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 1000,
  },
})
export class NotificationQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationQueueProcessor.name);

  constructor(
    @Inject(forwardRef(() => MailerService))
    private mailerService: MailerService,
    @Inject(forwardRef(() => AliyunSmsProvider))
    private smsProvider: AliyunSmsProvider,
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {
    super();
  }

  async process(job: Job<EmailJobData | SmsJobData>): Promise<void> {
    this.logger.log(`Processing notification job ${job.id} of type ${job.name}`);

    try {
      if (job.name === 'send-email') {
        await this.processEmailJob(job as Job<EmailJobData>);
      } else if (job.name === 'send-sms') {
        await this.processSmsJob(job as Job<SmsJobData>);
      }
    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error}`);
      throw error;
    }
  }

  private async processEmailJob(job: Job<EmailJobData>): Promise<void> {
    const { notificationId, userId, title, content } = job.data;

    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user?.email) {
        const error = `User ${userId} not found or has no email`;
        await this.updateSentChannel(notificationId, 'EMAIL', false, error);
        throw new Error(error);
      }

      await this.mailerService.sendMail({
        to: user.email,
        subject: title,
        text: content,
        html: `<p>${content}</p>`,
      });

      await this.updateSentChannel(notificationId, 'EMAIL', true);
      this.logger.log(`Email sent for notification ${notificationId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.updateSentChannel(notificationId, 'EMAIL', false, errorMessage);
      throw error;
    }
  }

  private async processSmsJob(job: Job<SmsJobData>): Promise<void> {
    const { notificationId, userId, content } = job.data;

    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user?.phone) {
        const error = `User ${userId} not found or has no phone`;
        await this.updateSentChannel(notificationId, 'SMS', false, error);
        throw new Error(error);
      }

      // Send SMS via Aliyun provider
      // Note: This uses the default template which expects a 'content' parameter
      // Make sure to configure an appropriate notification template in Aliyun console
      const result = await this.smsProvider.sendSms(user.phone, { content });

      if (!result.success) {
        const error = result.message ?? 'SMS send failed';
        await this.updateSentChannel(notificationId, 'SMS', false, error);
        throw new Error(error);
      }

      await this.updateSentChannel(notificationId, 'SMS', true);
      this.logger.log(`SMS sent for notification ${notificationId} to ${user.phone}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Only update if not already updated (avoid duplicate updates)
      if (!errorMessage.includes('not found')) {
        await this.updateSentChannel(notificationId, 'SMS', false, errorMessage);
      }
      throw error;
    }
  }

  private async updateSentChannel(
    notificationId: number,
    channel: string,
    success: boolean,
    error?: string,
  ): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (notification) {
      const sentChannels = notification.sentChannels || {};
      sentChannels[channel] = {
        sent: success,
        sentAt: new Date(),
        ...(error && { error }),
      };

      await this.notificationRepository.update(notificationId, {
        sentChannels,
      });
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.debug(`Job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    this.logger.error(`Job ${job?.id} failed: ${error.message}`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job): void {
    this.logger.debug(`Job ${job.id} is now active`);
  }
}

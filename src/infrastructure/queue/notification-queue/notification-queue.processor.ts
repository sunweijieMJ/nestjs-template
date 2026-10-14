import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, UnrecoverableError } from 'bullmq';
import { NOTIFICATION_QUEUE } from './notification-queue.constants';
import { MailerService } from '../../../integrations/mail/mailer.service';
import { AliyunSmsProvider } from '../../../integrations/sms/providers/aliyun-sms.provider';
import { UsersService } from '../../../core/users/users.service';
import { NotificationsService } from '../../../modules/notifications/notifications.service';
import { NotificationChannel } from '../../../modules/notifications/domain/notification';
import { WechatApiError, WechatService } from '../../../integrations/wechat/wechat.service';
import { AllConfigType } from '../../../config/config.type';
import { buildSubscribeMessage, WechatSubscribePayload } from '../../../modules/notifications/wechat-subscribe';

/**
 * 重试无法成功的订阅消息错误码
 * 43101 用户未订阅或次数已用完，40003 openid 无效，40037 模板 ID 无效，41030 page 无效，47003 模板参数不合法
 */
const SUBSCRIBE_UNRECOVERABLE_ERROR_CODES = new Set([43101, 40003, 40037, 41030, 47003]);

/** 重试无法成功的订阅消息错误：上述错误码，或小程序 AppID / Secret 未配置 */
function isUnrecoverableSubscribeError(error: unknown): boolean {
  if (error instanceof WechatApiError) {
    return SUBSCRIBE_UNRECOVERABLE_ERROR_CODES.has(error.errcode);
  }
  if (error instanceof UnprocessableEntityException) {
    const response = error.getResponse() as { errors?: { wechat?: string } };
    return response.errors?.wechat === 'notConfigured';
  }
  return false;
}

interface EmailJobData {
  notificationId: number;
  userId: number;
  title: string;
  content: string;
}

interface WechatSubscribeJobData {
  notificationId: number;
  userId: number;
  payload: WechatSubscribePayload;
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
    private readonly mailerService: MailerService,
    private readonly smsProvider: AliyunSmsProvider,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly wechatService: WechatService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    super();
  }

  async process(job: Job<EmailJobData | SmsJobData | WechatSubscribeJobData>): Promise<void> {
    this.logger.log(`Processing notification job ${job.id} of type ${job.name}`);

    try {
      if (job.name === 'send-email') {
        await this.processEmailJob(job as Job<EmailJobData>);
      } else if (job.name === 'send-sms') {
        await this.processSmsJob(job as Job<SmsJobData>);
      } else if (job.name === 'send-wechat-subscribe') {
        await this.processWechatSubscribeJob(job as Job<WechatSubscribeJobData>);
      }
    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error}`);
      throw error;
    }
  }

  private async processEmailJob(job: Job<EmailJobData>): Promise<void> {
    const { notificationId, userId, title, content } = job.data;

    try {
      const user = await this.usersService.findById(userId);
      if (!user?.email) {
        throw new Error(`User ${userId} not found or has no email`);
      }

      await this.mailerService.sendMail({
        to: user.email,
        subject: title,
        text: content,
        html: `<p>${content}</p>`,
      });

      await this.updateSentChannel(notificationId, NotificationChannel.EMAIL, true);
      this.logger.log(`Email sent for notification ${notificationId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.updateSentChannel(notificationId, NotificationChannel.EMAIL, false, errorMessage);
      throw error;
    }
  }

  private async processSmsJob(job: Job<SmsJobData>): Promise<void> {
    const { notificationId, userId, content } = job.data;

    try {
      const user = await this.usersService.findById(userId);
      if (!user?.phone) {
        throw new Error(`User ${userId} not found or has no phone`);
      }

      // Send SMS via Aliyun provider
      // Note: This uses the default template which expects a 'content' parameter
      // Make sure to configure an appropriate notification template in Aliyun console
      const result = await this.smsProvider.sendSms(user.phone, { content });

      if (!result.success) {
        throw new Error(result.message ?? 'SMS send failed');
      }

      await this.updateSentChannel(notificationId, NotificationChannel.SMS, true);
      this.logger.log(`SMS sent for notification ${notificationId} to ${user.phone}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.updateSentChannel(notificationId, NotificationChannel.SMS, false, errorMessage);
      throw error;
    }
  }

  private async processWechatSubscribeJob(job: Job<WechatSubscribeJobData>): Promise<void> {
    const { notificationId, userId, payload } = job.data;

    const templates = this.configService.get('wechat.subscribeTemplates', { infer: true });
    const message = buildSubscribeMessage(payload, templates?.[payload.scene]);
    if (!message) {
      this.logger.debug(`Subscribe template for scene ${payload.scene} not configured, skipped`);
      return;
    }

    const user = await this.usersService.findById(userId);
    if (!user?.wechatOpenId) {
      await this.updateSentChannel(notificationId, NotificationChannel.PUSH, false, 'User has no WeChat openId');
      return;
    }

    try {
      await this.wechatService.sendSubscribeMessage({ openId: user.wechatOpenId, ...message });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const failure = isUnrecoverableSubscribeError(error) ? new UnrecoverableError(errorMessage) : error;
      try {
        await this.updateSentChannel(notificationId, NotificationChannel.PUSH, false, errorMessage);
      } catch (recordError) {
        this.logger.warn(`Failed to record PUSH result for notification ${notificationId}: ${recordError}`);
      }
      throw failure;
    }

    await this.updateSentChannel(notificationId, NotificationChannel.PUSH, true);
    this.logger.log(`WeChat subscribe message sent for notification ${notificationId}`);
  }

  private async updateSentChannel(
    notificationId: number,
    channel: NotificationChannel,
    success: boolean,
    error?: string,
  ): Promise<void> {
    await this.notificationsService.recordChannelResult(notificationId, channel, {
      sent: success,
      ...(error && { error }),
    });
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

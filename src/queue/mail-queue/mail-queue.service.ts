import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';
import { MAIL_QUEUE } from './mail-queue.constants';

export interface MailJobData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  templatePath?: string;
  context?: Record<string, unknown>;
}

@Injectable()
export class MailQueueService {
  private readonly logger = new Logger(MailQueueService.name);

  constructor(
    @InjectQueue(MAIL_QUEUE) private mailQueue: Queue,
    private configService: ConfigService<AllConfigType>,
  ) {}

  async addMailJob(data: MailJobData): Promise<boolean> {
    const redisEnabled = this.configService.get('redis.enabled', { infer: true });

    if (!redisEnabled) {
      this.logger.warn('Redis is disabled. Mail will not be queued.');
      return false;
    }

    try {
      await this.mailQueue.add('send-mail', data, {
        priority: 1,
      });
      this.logger.log(`Mail job added to queue: ${data.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to add mail job: ${error}`);
      return false;
    }
  }

  async addBulkMailJobs(jobs: MailJobData[]): Promise<boolean> {
    const redisEnabled = this.configService.get('redis.enabled', { infer: true });

    if (!redisEnabled) {
      this.logger.warn('Redis is disabled. Bulk mail will not be queued.');
      return false;
    }

    try {
      await this.mailQueue.addBulk(
        jobs.map((data) => ({
          name: 'send-mail',
          data,
        })),
      );
      this.logger.log(`${jobs.length} mail jobs added to queue`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to add bulk mail jobs: ${error}`);
      return false;
    }
  }

  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.mailQueue.getWaitingCount(),
      this.mailQueue.getActiveCount(),
      this.mailQueue.getCompletedCount(),
      this.mailQueue.getFailedCount(),
      this.mailQueue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }
}

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bullmq';
import { MailerService } from '../../mailer/mailer.service';
import { MailJobData } from './mail-queue.service';
import { MAIL_QUEUE } from './mail-queue.module';

@Processor(MAIL_QUEUE)
export class MailQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(MailQueueProcessor.name);

  constructor(
    @Inject(forwardRef(() => MailerService))
    private mailerService: MailerService,
  ) {
    super();
  }

  async process(job: Job<MailJobData>): Promise<void> {
    this.logger.log(`Processing mail job ${job.id} to ${job.data.to}`);

    const { to, subject, text, html, templatePath, context } = job.data;

    try {
      if (templatePath && context) {
        await this.mailerService.sendMail({
          to,
          subject,
          text,
          templatePath,
          context,
        });
      } else {
        await this.mailerService.sendMail({
          to,
          subject,
          text,
          html,
        });
      }

      this.logger.log(`Mail job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Mail job ${job.id} failed: ${error}`);
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<MailJobData>): void {
    this.logger.debug(`Job ${job.id} completed for ${job.data.to}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<MailJobData> | undefined, error: Error): void {
    this.logger.error(`Job ${job?.id} failed for ${job?.data.to}: ${error.message}`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job<MailJobData>): void {
    this.logger.debug(`Job ${job.id} is now active for ${job.data.to}`);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class CleanupReadNotificationsTask {
  private readonly logger = new Logger(CleanupReadNotificationsTask.name);
  private readonly RETENTION_DAYS = 30;

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  /**
   * Clean up old read notifications every day at 4:00 AM
   * Soft deletes notifications that have been read for more than 30 days
   */
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async handleCleanup(): Promise<void> {
    this.logger.log('Starting cleanup of old read notifications');

    try {
      const result = await this.dataSource.query(
        `
        UPDATE notification
        SET "deletedAt" = NOW()
        WHERE "isRead" = true
          AND "readAt" IS NOT NULL
          AND "readAt" < NOW() - INTERVAL '${this.RETENTION_DAYS} days'
          AND "deletedAt" IS NULL
      `,
      );

      const deletedCount = result[1] ?? 0;
      this.logger.log(`Cleanup completed: ${deletedCount} old read notifications soft deleted`);
    } catch (error) {
      this.logger.error(`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}

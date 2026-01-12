import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class CleanupOldSessionsTask {
  private readonly logger = new Logger(CleanupOldSessionsTask.name);
  private readonly RETENTION_DAYS = 7;

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  /**
   * Clean up old soft-deleted sessions every day at 3:00 AM
   * Hard deletes sessions where deletedAt < NOW() - 7 days
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCleanup(): Promise<void> {
    this.logger.log('Starting cleanup of old sessions');

    try {
      const result = await this.dataSource.query(
        `
        DELETE FROM session
        WHERE "deletedAt" IS NOT NULL
          AND "deletedAt" < NOW() - INTERVAL '${this.RETENTION_DAYS} days'
      `,
      );

      const deletedCount = result[1] ?? 0;
      this.logger.log(`Cleanup completed: ${deletedCount} old sessions permanently deleted`);
    } catch (error) {
      this.logger.error(`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}

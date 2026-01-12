import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class CleanupExpiredSharesTask {
  private readonly logger = new Logger(CleanupExpiredSharesTask.name);

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  /**
   * Clean up expired shares every day at 2:00 AM
   * Soft deletes shares where expiresAt < NOW() and deletedAt IS NULL
   * Also cleans up associated share_log entries
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCleanup(): Promise<void> {
    this.logger.log('Starting cleanup of expired shares');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get expired share IDs first (for logging)
      const expiredShares = await queryRunner.query(`
        SELECT id, "shareCode", "expiresAt"
        FROM share
        WHERE "expiresAt" < NOW()
          AND "deletedAt" IS NULL
      `);

      if (expiredShares.length === 0) {
        this.logger.log('No expired shares found');
        await queryRunner.commitTransaction();
        return;
      }

      const expiredIds = expiredShares.map((s: { id: number }) => s.id);

      // Soft delete associated share_log entries
      const logsResult = await queryRunner.query(
        `
        UPDATE share_log
        SET "deletedAt" = NOW()
        WHERE "shareId" = ANY($1)
          AND "deletedAt" IS NULL
      `,
        [expiredIds],
      );

      // Soft delete expired shares
      const sharesResult = await queryRunner.query(
        `
        UPDATE share
        SET "deletedAt" = NOW()
        WHERE id = ANY($1)
          AND "deletedAt" IS NULL
      `,
        [expiredIds],
      );

      await queryRunner.commitTransaction();

      this.logger.log(
        `Cleanup completed: ${sharesResult[1] ?? expiredIds.length} shares and ${logsResult[1] ?? 0} share logs soft deleted`,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

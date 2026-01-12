import { Injectable, Logger, Scope } from '@nestjs/common';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';

/**
 * 事务服务 - 提供数据库事务操作支持
 */
@Injectable({ scope: Scope.REQUEST })
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);
  private queryRunner: QueryRunner | null = null;

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Get the current EntityManager. If a transaction is active, returns the
   * transactional EntityManager, otherwise returns the default EntityManager.
   */
  get manager(): EntityManager {
    return this.queryRunner?.manager ?? this.dataSource.manager;
  }

  /**
   * Check if a transaction is currently active
   */
  get isTransactionActive(): boolean {
    return this.queryRunner?.isTransactionActive ?? false;
  }

  /**
   * Execute a callback function within a transaction.
   * If the callback throws an error, the transaction will be rolled back.
   * If the callback succeeds, the transaction will be committed.
   *
   * @param callback - The function to execute within the transaction
   * @returns The result of the callback function
   *
   * @example
   * ```typescript
   * const result = await this.transactionService.run(async (manager) => {
   *   const user = await manager.save(User, userData);
   *   const profile = await manager.save(Profile, { userId: user.id });
   *   return user;
   * });
   * ```
   */
  async run<T>(callback: (manager: EntityManager) => Promise<T>): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    this.logger.debug('Transaction started');

    try {
      const result = await callback(queryRunner.manager);
      await queryRunner.commitTransaction();
      this.logger.debug('Transaction committed');
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.warn('Transaction rolled back due to error', { error });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Start a new transaction manually.
   * Remember to call commit() or rollback() when done.
   */
  async startTransaction(): Promise<void> {
    if (this.queryRunner) {
      throw new Error('Transaction already started');
    }

    this.queryRunner = this.dataSource.createQueryRunner();
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();
    this.logger.debug('Manual transaction started');
  }

  /**
   * Commit the current transaction
   */
  async commit(): Promise<void> {
    if (!this.queryRunner) {
      throw new Error('No transaction to commit');
    }

    await this.queryRunner.commitTransaction();
    await this.queryRunner.release();
    this.queryRunner = null;
    this.logger.debug('Transaction committed');
  }

  /**
   * Rollback the current transaction
   */
  async rollback(): Promise<void> {
    if (!this.queryRunner) {
      throw new Error('No transaction to rollback');
    }

    await this.queryRunner.rollbackTransaction();
    await this.queryRunner.release();
    this.queryRunner = null;
    this.logger.debug('Transaction rolled back');
  }
}

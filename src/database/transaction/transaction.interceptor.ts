import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { Observable, from, lastValueFrom } from 'rxjs';
import { TRANSACTIONAL_KEY } from './transaction.decorator';

/**
 * TransactionInterceptor wraps controller methods marked with @Transactional()
 * in a database transaction. If the method throws an error, the transaction
 * will be rolled back. If the method succeeds, the transaction will be committed.
 */
@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TransactionInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const isTransactional = this.reflector.get<boolean>(TRANSACTIONAL_KEY, context.getHandler());

    if (!isTransactional) {
      return next.handle();
    }

    return from(this.runInTransaction(next));
  }

  private async runInTransaction(next: CallHandler): Promise<unknown> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    this.logger.debug('Transaction started via interceptor');

    try {
      const result = await lastValueFrom(next.handle());
      await queryRunner.commitTransaction();
      this.logger.debug('Transaction committed via interceptor');
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.warn('Transaction rolled back via interceptor', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

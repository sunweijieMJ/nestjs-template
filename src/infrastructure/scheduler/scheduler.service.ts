import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  onModuleInit(): void {
    this.logger.log('Scheduler service initialized');
  }

  logTaskExecution(taskName: string, message: string): void {
    this.logger.log(`[${taskName}] ${message}`);
  }

  logTaskError(taskName: string, error: Error): void {
    this.logger.error(`[${taskName}] Task failed: ${error.message}`, error.stack);
  }
}

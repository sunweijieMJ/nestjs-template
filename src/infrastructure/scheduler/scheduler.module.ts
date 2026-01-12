import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { CleanupExpiredSharesTask } from './tasks/cleanup-expired-shares.task';
import { CleanupOldSessionsTask } from './tasks/cleanup-old-sessions.task';
import { CleanupReadNotificationsTask } from './tasks/cleanup-read-notifications.task';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [SchedulerService, CleanupExpiredSharesTask, CleanupOldSessionsTask, CleanupReadNotificationsTask],
  exports: [SchedulerService],
})
export class SchedulerModule {}

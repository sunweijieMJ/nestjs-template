import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationSettingEntity } from './entities/notification-setting.entity';
import { NotificationRepository } from '../notification.repository';
import { NotificationSettingRepository } from '../notification-setting.repository';
import { NotificationRelationalRepository } from './repositories/notification.repository';
import { NotificationSettingRelationalRepository } from './repositories/notification-setting.repository';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationEntity, NotificationSettingEntity])],
  providers: [
    {
      provide: NotificationRepository,
      useClass: NotificationRelationalRepository,
    },
    {
      provide: NotificationSettingRepository,
      useClass: NotificationSettingRelationalRepository,
    },
  ],
  exports: [NotificationRepository, NotificationSettingRepository],
})
export class RelationalNotificationPersistenceModule {}

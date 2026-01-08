import { NotificationSetting } from '../../../../domain/notification-setting';
import { NotificationSettingEntity } from '../entities/notification-setting.entity';
import { NotificationCategory } from '../../../../domain/notification';

export class NotificationSettingMapper {
  static toDomain(raw: NotificationSettingEntity): NotificationSetting {
    const domainEntity = new NotificationSetting();
    domainEntity.id = raw.id;
    domainEntity.userId = raw.userId;
    domainEntity.category = raw.category as NotificationCategory;
    domainEntity.enableInApp = raw.enableInApp;
    domainEntity.enableEmail = raw.enableEmail;
    domainEntity.enableSms = raw.enableSms;
    domainEntity.enablePush = raw.enablePush;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    return domainEntity;
  }

  static toPersistence(
    domainEntity: Omit<NotificationSetting, 'id' | 'createdAt' | 'updatedAt'>,
  ): NotificationSettingEntity {
    const persistenceEntity = new NotificationSettingEntity();
    persistenceEntity.userId = Number(domainEntity.userId);
    persistenceEntity.category = domainEntity.category;
    persistenceEntity.enableInApp = domainEntity.enableInApp;
    persistenceEntity.enableEmail = domainEntity.enableEmail;
    persistenceEntity.enableSms = domainEntity.enableSms;
    persistenceEntity.enablePush = domainEntity.enablePush;
    return persistenceEntity;
  }
}

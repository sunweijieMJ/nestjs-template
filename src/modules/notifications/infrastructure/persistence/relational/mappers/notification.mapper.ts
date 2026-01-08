import {
  Notification,
  NotificationType,
  NotificationCategory,
  NotificationChannel,
} from '../../../../domain/notification';
import { NotificationEntity } from '../entities/notification.entity';

export class NotificationMapper {
  static toDomain(raw: NotificationEntity): Notification {
    const domainEntity = new Notification();
    domainEntity.id = raw.id;
    domainEntity.userId = raw.userId;
    domainEntity.type = raw.type as NotificationType;
    domainEntity.category = raw.category as NotificationCategory;
    domainEntity.title = raw.title;
    domainEntity.content = raw.content;
    domainEntity.metadata = raw.metadata ?? undefined;
    domainEntity.channels = raw.channels as NotificationChannel[];
    domainEntity.sentChannels = raw.sentChannels;
    domainEntity.isRead = raw.isRead;
    domainEntity.readAt = raw.readAt ?? undefined;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;
    return domainEntity;
  }

  static toPersistence(
    domainEntity: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): NotificationEntity {
    const persistenceEntity = new NotificationEntity();
    persistenceEntity.userId = Number(domainEntity.userId);
    persistenceEntity.type = domainEntity.type;
    persistenceEntity.category = domainEntity.category;
    persistenceEntity.title = domainEntity.title;
    persistenceEntity.content = domainEntity.content;
    persistenceEntity.metadata = domainEntity.metadata ?? null;
    persistenceEntity.channels = domainEntity.channels;
    persistenceEntity.sentChannels = domainEntity.sentChannels;
    persistenceEntity.isRead = domainEntity.isRead;
    persistenceEntity.readAt = domainEntity.readAt ?? null;
    return persistenceEntity;
  }
}

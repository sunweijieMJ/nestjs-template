import { NullableType } from '../../../../common/types/nullable.type';
import { Notification } from '../../domain/notification';
import { DeepPartial } from '../../../../common/types/deep-partial.type';
import { IPaginationOptions } from '../../../../common/types/pagination-options';
import { QueryNotificationDto } from '../../dto/query-notification.dto';

export abstract class NotificationRepository {
  abstract create(data: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Notification>;

  abstract findManyWithPagination({
    userId,
    filterOptions,
    paginationOptions,
  }: {
    userId: Notification['userId'];
    filterOptions?: QueryNotificationDto | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Notification[]>;

  abstract findById(id: Notification['id']): Promise<NullableType<Notification>>;

  abstract findByIdAndUserId(
    id: Notification['id'],
    userId: Notification['userId'],
  ): Promise<NullableType<Notification>>;

  abstract update(id: Notification['id'], payload: DeepPartial<Notification>): Promise<Notification | null>;

  abstract markAsRead(id: Notification['id'], userId: Notification['userId']): Promise<Notification | null>;

  abstract markAllAsRead(userId: Notification['userId']): Promise<void>;

  abstract countUnreadByUserId(userId: Notification['userId']): Promise<number>;

  abstract countUnreadByCategory(userId: Notification['userId']): Promise<Record<string, number>>;

  abstract countByUserId(userId: Notification['userId'], filterOptions?: QueryNotificationDto | null): Promise<number>;

  abstract remove(id: Notification['id']): Promise<void>;
}

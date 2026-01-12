import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { NotificationRepository } from './infrastructure/persistence/notification.repository';
import { NotificationSettingRepository } from './infrastructure/persistence/notification-setting.repository';
import { Notification, NotificationChannel } from './domain/notification';
import { NotificationSetting } from './domain/notification-setting';
import { IPaginationOptions } from '../../common/types/pagination-options';
import { NOTIFICATION_QUEUE } from '../../infrastructure/queue/notification-queue/notification-queue.constants';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly settingRepository: NotificationSettingRepository,
    @InjectQueue(NOTIFICATION_QUEUE) private readonly notificationQueue: Queue,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    this.logger.log(`Creating notification for user: ${createNotificationDto.userId}`);

    // Check user preferences
    const settings = await this.settingRepository.findByUserIdAndCategory(
      createNotificationDto.userId,
      createNotificationDto.category,
    );

    // Filter channels based on user preferences
    let allowedChannels = createNotificationDto.channels;
    if (settings) {
      allowedChannels = allowedChannels.filter((channel) => {
        switch (channel) {
          case NotificationChannel.IN_APP:
            return settings.enableInApp;
          case NotificationChannel.EMAIL:
            return settings.enableEmail;
          case NotificationChannel.SMS:
            return settings.enableSms;
          case NotificationChannel.PUSH:
            return settings.enablePush;
          default:
            return false;
        }
      });
    }

    // Create notification in database
    const notification = await this.notificationRepository.create({
      userId: createNotificationDto.userId,
      type: createNotificationDto.type,
      category: createNotificationDto.category,
      title: createNotificationDto.title,
      content: createNotificationDto.content,
      metadata: createNotificationDto.metadata,
      channels: allowedChannels,
      sentChannels: {},
      isRead: false,
    });

    // Queue external channel notifications
    await this.queueExternalNotifications(notification);

    this.logger.log(`Notification created successfully: ${notification.id}`);
    return notification;
  }

  private async queueExternalNotifications(notification: Notification): Promise<void> {
    for (const channel of notification.channels) {
      if (channel === NotificationChannel.EMAIL) {
        await this.notificationQueue.add('send-email', {
          notificationId: notification.id,
          userId: notification.userId,
          title: notification.title,
          content: notification.content,
        });
      } else if (channel === NotificationChannel.SMS) {
        await this.notificationQueue.add('send-sms', {
          notificationId: notification.id,
          userId: notification.userId,
          content: notification.content,
        });
      }
    }
  }

  async findManyWithPagination({
    userId,
    filterOptions,
    paginationOptions,
  }: {
    userId: number;
    filterOptions?: QueryNotificationDto | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Notification[]> {
    return this.notificationRepository.findManyWithPagination({
      userId,
      filterOptions,
      paginationOptions,
    });
  }

  async findManyWithPaginationAndCount({
    userId,
    filterOptions,
    paginationOptions,
  }: {
    userId: number;
    filterOptions?: QueryNotificationDto | null;
    paginationOptions: IPaginationOptions;
  }): Promise<{ data: Notification[]; total: number }> {
    const [data, total] = await Promise.all([
      this.notificationRepository.findManyWithPagination({
        userId,
        filterOptions,
        paginationOptions,
      }),
      this.notificationRepository.countByUserId(userId, filterOptions),
    ]);

    return { data, total };
  }

  async findOne(id: number, userId: number): Promise<Notification> {
    const notification = await this.notificationRepository.findByIdAndUserId(id, userId);

    if (!notification) {
      throw new NotFoundException({
        error: 'notificationNotFound',
        message: 'Notification not found',
      });
    }

    return notification;
  }

  async markAsRead(id: number, userId: number): Promise<Notification> {
    const notification = await this.notificationRepository.markAsRead(id, userId);

    if (!notification) {
      throw new NotFoundException({
        error: 'notificationNotFound',
        message: 'Notification not found',
      });
    }

    this.logger.log(`Notification ${id} marked as read by user ${userId}`);
    return notification;
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.markAllAsRead(userId);
    this.logger.log(`All notifications marked as read for user ${userId}`);
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationRepository.countUnreadByUserId(userId);
  }

  async getUnreadCountByCategory(userId: number): Promise<Record<string, number>> {
    return this.notificationRepository.countUnreadByCategory(userId);
  }

  async remove(id: number, userId: number): Promise<void> {
    const notification = await this.notificationRepository.findByIdAndUserId(id, userId);

    if (!notification) {
      throw new NotFoundException({
        error: 'notificationNotFound',
        message: 'Notification not found',
      });
    }

    await this.notificationRepository.remove(id);
    this.logger.log(`Notification ${id} deleted by user ${userId}`);
  }

  async getSettings(userId: number): Promise<NotificationSetting[]> {
    return this.settingRepository.findAllByUserId(userId);
  }

  async updateSettings(userId: number, updateDto: UpdateNotificationSettingsDto): Promise<NotificationSetting> {
    let setting = await this.settingRepository.findByUserIdAndCategory(userId, updateDto.category);

    if (!setting) {
      // Create if doesn't exist
      setting = await this.settingRepository.create({
        userId,
        category: updateDto.category,
        enableInApp: updateDto.enableInApp,
        enableEmail: updateDto.enableEmail,
        enableSms: updateDto.enableSms,
        enablePush: updateDto.enablePush,
      });
    } else {
      // Update existing
      const updated = await this.settingRepository.update(userId, updateDto.category, {
        enableInApp: updateDto.enableInApp,
        enableEmail: updateDto.enableEmail,
        enableSms: updateDto.enableSms,
        enablePush: updateDto.enablePush,
      });

      if (!updated) {
        throw new NotFoundException({
          error: 'settingNotFound',
          message: 'Notification setting not found',
        });
      }

      setting = updated;
    }

    this.logger.log(`Notification settings updated for user ${userId}, category ${updateDto.category}`);
    return setting;
  }

  async initializeDefaultSettings(userId: number): Promise<void> {
    await this.settingRepository.initializeDefaultSettings(userId);
    this.logger.log(`Default notification settings initialized for user ${userId}`);
  }
}

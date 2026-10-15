import type { Mocked } from 'vitest';
import { Queue } from 'bullmq';
import { NotificationsService } from './notifications.service';
import { NotificationRepository } from './infrastructure/persistence/notification.repository';
import { NotificationSettingRepository } from './infrastructure/persistence/notification-setting.repository';
import { Notification, NotificationCategory, NotificationChannel } from './domain/notification';
import { NotificationSetting } from './domain/notification-setting';
import { WechatSubscribeScene } from './wechat-subscribe';

describe('NotificationsService', () => {
  describe('notifyPaymentSucceeded', () => {
    let notificationRepository: Mocked<Pick<NotificationRepository, 'create'>>;
    let settingRepository: Mocked<Pick<NotificationSettingRepository, 'findByUserIdAndCategory'>>;
    let queue: Mocked<Pick<Queue, 'add'>>;
    let service: NotificationsService;

    const params = {
      userId: 10,
      orderId: 1,
      orderNo: 'ORD1',
      paidAmount: 9900,
      paidAt: new Date('2026-10-14T07:01:00Z'),
    };

    beforeEach(() => {
      notificationRepository = {
        create: vi.fn((data) => Promise.resolve({ id: 100, ...data } as Notification)),
      };
      settingRepository = { findByUserIdAndCategory: vi.fn().mockResolvedValue(null) };
      queue = { add: vi.fn() };
      service = new NotificationsService(
        notificationRepository as unknown as NotificationRepository,
        settingRepository as unknown as NotificationSettingRepository,
        queue as unknown as Queue,
      );
    });

    it('should create an in-app payment notification and queue the WeChat subscribe message', async () => {
      await service.notifyPaymentSucceeded(params);

      expect(notificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 10,
          category: NotificationCategory.PAYMENT,
          title: '支付成功',
          content: '订单 ORD1 已支付 99.00元',
          channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        }),
      );
      expect(queue.add).toHaveBeenCalledWith('send-wechat-subscribe', {
        notificationId: 100,
        userId: 10,
        payload: {
          scene: WechatSubscribeScene.ORDER_PAID,
          values: { orderNo: 'ORD1', amount: '99.00元', paidAt: '2026年10月14日 15:01' },
          page: 'pages-sub/order/detail/index?id=1',
        },
      });
    });

    it('should not queue the WeChat subscribe message when the user disabled push for payments', async () => {
      settingRepository.findByUserIdAndCategory.mockResolvedValue({
        enableInApp: true,
        enableEmail: true,
        enableSms: true,
        enablePush: false,
      } as NotificationSetting);

      await service.notifyPaymentSucceeded(params);

      expect(notificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ channels: [NotificationChannel.IN_APP] }),
      );
      expect(queue.add).not.toHaveBeenCalled();
    });

    it('should still save the in-app notification when the queue is unavailable', async () => {
      const serviceWithoutQueue = new NotificationsService(
        notificationRepository as unknown as NotificationRepository,
        settingRepository as unknown as NotificationSettingRepository,
      );

      await expect(serviceWithoutQueue.notifyPaymentSucceeded(params)).resolves.toBeUndefined();

      expect(notificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH] }),
      );
    });

    it('should not throw when the paid time is invalid', async () => {
      await expect(service.notifyPaymentSucceeded({ ...params, paidAt: new Date('invalid') })).resolves.toBeUndefined();
      expect(notificationRepository.create).not.toHaveBeenCalled();
    });

    it('should not throw when creating the notification fails', async () => {
      notificationRepository.create.mockRejectedValue(new Error('db down'));

      await expect(service.notifyPaymentSucceeded(params)).resolves.toBeUndefined();
    });
  });
});

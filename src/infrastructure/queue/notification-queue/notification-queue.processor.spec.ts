import type { Mocked } from 'vitest';
import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { Job, UnrecoverableError } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { NotificationQueueProcessor } from './notification-queue.processor';
import { MailerService } from '../../../integrations/mail/mailer.service';
import { AliyunSmsProvider } from '../../../integrations/sms/providers/aliyun-sms.provider';
import { UsersService } from '../../../core/users/users.service';
import { NotificationsService } from '../../../modules/notifications/notifications.service';
import { WechatApiError, WechatService } from '../../../integrations/wechat/wechat.service';
import { AllConfigType } from '../../../config/config.type';
import { WechatSubscribeScene } from '../../../modules/notifications/wechat-subscribe';

describe('NotificationQueueProcessor', () => {
  let mailerService: Mocked<Pick<MailerService, 'sendMail'>>;
  let usersService: Mocked<Pick<UsersService, 'findById'>>;
  let notificationsService: Mocked<Pick<NotificationsService, 'recordChannelResult'>>;
  let wechatService: Mocked<Pick<WechatService, 'sendSubscribeMessage'>>;
  let subscribeTemplates: Record<string, { templateId: string; fields: Record<string, string> }>;
  let processor: NotificationQueueProcessor;

  const emailJob = { id: '1', name: 'send-email', data: { notificationId: 5, userId: 1, title: 'T', content: 'C' } };

  beforeEach(() => {
    mailerService = { sendMail: vi.fn() };
    usersService = { findById: vi.fn() };
    notificationsService = { recordChannelResult: vi.fn() };
    wechatService = { sendSubscribeMessage: vi.fn() };
    subscribeTemplates = { orderPaid: { templateId: 'TPL1', fields: { orderNo: 'character_string1' } } };
    const configService = { get: vi.fn(() => subscribeTemplates) };
    processor = new NotificationQueueProcessor(
      mailerService as unknown as MailerService,
      {} as AliyunSmsProvider,
      usersService as unknown as UsersService,
      notificationsService as unknown as NotificationsService,
      wechatService as unknown as WechatService,
      configService as unknown as ConfigService<AllConfigType>,
    );
  });

  it('should send the email to the user and record the channel as sent', async () => {
    usersService.findById.mockResolvedValue({ id: 1, email: 'a@b.c' } as never);

    await processor.process(emailJob as Job);

    expect(mailerService.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'a@b.c', subject: 'T' }));
    expect(notificationsService.recordChannelResult).toHaveBeenCalledWith(5, 'EMAIL', { sent: true });
  });

  it('should record the failure and fail the job when the user has no email', async () => {
    usersService.findById.mockResolvedValue({ id: 1, email: null } as never);

    await expect(processor.process(emailJob as Job)).rejects.toThrow('has no email');
    expect(notificationsService.recordChannelResult).toHaveBeenCalledTimes(1);
    expect(notificationsService.recordChannelResult).toHaveBeenCalledWith(
      5,
      'EMAIL',
      expect.objectContaining({ sent: false }),
    );
    expect(mailerService.sendMail).not.toHaveBeenCalled();
  });

  it('should complete the job without resending when recording a sent email fails', async () => {
    usersService.findById.mockResolvedValue({ id: 1, email: 'a@b.c' } as never);
    notificationsService.recordChannelResult.mockRejectedValue(new Error('db down'));

    await expect(processor.process(emailJob as Job)).resolves.toBeUndefined();
    expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
  });

  it('should still fail the job when recording an email failure fails', async () => {
    usersService.findById.mockResolvedValue({ id: 1, email: 'a@b.c' } as never);
    mailerService.sendMail.mockRejectedValue(new Error('smtp down'));
    notificationsService.recordChannelResult.mockRejectedValue(new Error('db down'));

    await expect(processor.process(emailJob as Job)).rejects.toThrow('smtp down');
  });

  describe('send-wechat-subscribe', () => {
    const subscribeJob = {
      id: '2',
      name: 'send-wechat-subscribe',
      data: {
        notificationId: 6,
        userId: 1,
        payload: {
          scene: WechatSubscribeScene.ORDER_PAID,
          values: { orderNo: 'ORD1' },
          page: 'pages-sub/order/detail/index?id=1',
        },
      },
    };

    it('should send the subscribe message to the user openId and record the channel as sent', async () => {
      usersService.findById.mockResolvedValue({ id: 1, wechatOpenId: 'OPEN1' } as never);

      await processor.process(subscribeJob as Job);

      expect(wechatService.sendSubscribeMessage).toHaveBeenCalledWith({
        openId: 'OPEN1',
        templateId: 'TPL1',
        page: 'pages-sub/order/detail/index?id=1',
        data: { character_string1: 'ORD1' },
      });
      expect(notificationsService.recordChannelResult).toHaveBeenCalledWith(6, 'PUSH', { sent: true });
    });

    it('should skip without sending when the template is not configured', async () => {
      subscribeTemplates = { orderPaid: { templateId: '', fields: {} } };

      await processor.process(subscribeJob as Job);

      expect(usersService.findById).not.toHaveBeenCalled();
      expect(wechatService.sendSubscribeMessage).not.toHaveBeenCalled();
    });

    it('should record the failure without retrying when the user has no openId', async () => {
      usersService.findById.mockResolvedValue({ id: 1, wechatOpenId: null } as never);

      await expect(processor.process(subscribeJob as Job)).resolves.toBeUndefined();
      expect(notificationsService.recordChannelResult).toHaveBeenCalledWith(
        6,
        'PUSH',
        expect.objectContaining({ sent: false }),
      );
    });

    it('should fail the job without retry when the user has not subscribed', async () => {
      usersService.findById.mockResolvedValue({ id: 1, wechatOpenId: 'OPEN1' } as never);
      wechatService.sendSubscribeMessage.mockRejectedValue(new WechatApiError(43101, 'user refuse'));

      await expect(processor.process(subscribeJob as Job)).rejects.toBeInstanceOf(UnrecoverableError);
    });

    it('should fail the job without retry when the mini program credentials are not configured', async () => {
      usersService.findById.mockResolvedValue({ id: 1, wechatOpenId: 'OPEN1' } as never);
      wechatService.sendSubscribeMessage.mockRejectedValue(
        new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: { wechat: 'notConfigured' },
        }),
      );

      await expect(processor.process(subscribeJob as Job)).rejects.toBeInstanceOf(UnrecoverableError);
    });

    it('should keep the send error when recording the result fails', async () => {
      usersService.findById.mockResolvedValue({ id: 1, wechatOpenId: 'OPEN1' } as never);
      wechatService.sendSubscribeMessage.mockRejectedValue(new WechatApiError(43101, 'user refuse'));
      notificationsService.recordChannelResult.mockRejectedValue(new Error('db down'));

      await expect(processor.process(subscribeJob as Job)).rejects.toBeInstanceOf(UnrecoverableError);
    });

    it('should rethrow retryable errors', async () => {
      usersService.findById.mockResolvedValue({ id: 1, wechatOpenId: 'OPEN1' } as never);
      wechatService.sendSubscribeMessage.mockRejectedValue(new WechatApiError(-1, 'system busy'));

      const error = await processor.process(subscribeJob as Job).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(WechatApiError);
      expect(error).not.toBeInstanceOf(UnrecoverableError);
    });
  });
});

import { Job } from 'bullmq';
import { NotificationQueueProcessor } from './notification-queue.processor';
import { MailerService } from '../../../integrations/mail/mailer.service';
import { AliyunSmsProvider } from '../../../integrations/sms/providers/aliyun-sms.provider';
import { UsersService } from '../../../core/users/users.service';
import { NotificationsService } from '../../../modules/notifications/notifications.service';

describe('NotificationQueueProcessor', () => {
  let mailerService: jest.Mocked<Pick<MailerService, 'sendMail'>>;
  let usersService: jest.Mocked<Pick<UsersService, 'findById'>>;
  let notificationsService: jest.Mocked<Pick<NotificationsService, 'recordChannelResult'>>;
  let processor: NotificationQueueProcessor;

  const emailJob = { id: '1', name: 'send-email', data: { notificationId: 5, userId: 1, title: 'T', content: 'C' } };

  beforeEach(() => {
    mailerService = { sendMail: jest.fn() };
    usersService = { findById: jest.fn() };
    notificationsService = { recordChannelResult: jest.fn() };
    processor = new NotificationQueueProcessor(
      mailerService as unknown as MailerService,
      {} as AliyunSmsProvider,
      usersService as unknown as UsersService,
      notificationsService as unknown as NotificationsService,
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
});

import type { Mocked } from 'vitest';
import { UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { SessionService } from '../session/session.service';
import { UsersService } from '../users/users.service';
import { TokenService } from './services/token.service';
import { StatusEnum } from '../../common/enums/statuses/statuses.enum';
import { WechatService } from '../../integrations/wechat/wechat.service';
import { NotificationsService } from '../../modules/notifications/notifications.service';
import { User } from '../users/domain/user';

describe('AuthService', () => {
  describe('refreshToken', () => {
    let sessionService: Mocked<Pick<SessionService, 'findById' | 'rotateHash' | 'wasRecentlyRotatedFrom' | 'revoke'>>;
    let tokenService: Mocked<Pick<TokenService, 'generateSessionHash' | 'getTokensData'>>;
    let service: AuthService;

    beforeEach(async () => {
      sessionService = {
        findById: vi.fn().mockResolvedValue({ id: 10, hash: 'H1', user: { id: 1 } }),
        rotateHash: vi.fn().mockResolvedValue(true),
        wasRecentlyRotatedFrom: vi.fn().mockResolvedValue(false),
        revoke: vi.fn(),
      };
      tokenService = {
        generateSessionHash: vi.fn().mockReturnValue('H2'),
        getTokensData: vi.fn().mockResolvedValue({ token: 't', refreshToken: 'r', tokenExpires: 1 }),
      };
      const usersService = {
        findById: vi.fn().mockResolvedValue({ id: 1, role: { id: 2 }, status: { id: StatusEnum.active } }),
      };

      const moduleRef = await Test.createTestingModule({ providers: [AuthService] })
        .useMocker((token) => {
          if (token === SessionService) return sessionService;
          if (token === TokenService) return tokenService;
          if (token === UsersService) return usersService;
          return {};
        })
        .compile();
      service = moduleRef.get(AuthService);
    });

    it('should issue new tokens and rotate the session hash', async () => {
      await expect(service.refreshToken({ sessionId: 10, hash: 'H1' })).resolves.toEqual({
        token: 't',
        refreshToken: 'r',
        tokenExpires: 1,
      });
      expect(sessionService.rotateHash).toHaveBeenCalledWith(10, 'H1', 'H2');
    });

    it('should keep the session hash when signing the new tokens fails', async () => {
      tokenService.getTokensData.mockRejectedValue(new Error('sign failed'));

      await expect(service.refreshToken({ sessionId: 10, hash: 'H1' })).rejects.toThrow('sign failed');
      expect(sessionService.rotateHash).not.toHaveBeenCalled();
    });

    it('should revoke the session when an old refresh token is presented after the grace period', async () => {
      await expect(service.refreshToken({ sessionId: 10, hash: 'H0' })).rejects.toBeInstanceOf(UnauthorizedException);
      expect(sessionService.revoke).toHaveBeenCalledWith(10);
    });

    it('should reject without revoking when the refresh token was rotated moments ago', async () => {
      sessionService.wasRecentlyRotatedFrom.mockResolvedValue(true);

      await expect(service.refreshToken({ sessionId: 10, hash: 'H0' })).rejects.toBeInstanceOf(UnauthorizedException);
      expect(sessionService.revoke).not.toHaveBeenCalled();
    });

    it('should reject when another refresh rotated the hash first', async () => {
      sessionService.rotateHash.mockResolvedValue(false);

      await expect(service.refreshToken({ sessionId: 10, hash: 'H1' })).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('wechatPhoneLogin', () => {
    const dto = { loginCode: 'L1', phoneCode: 'P1' };
    const PHONE = '13800000000';

    let usersService: Mocked<
      Pick<
        UsersService,
        'findByWechatOpenId' | 'findByPhone' | 'findById' | 'create' | 'bindPhoneIfEmpty' | 'bindWechatIfEmpty'
      >
    >;
    let wechatService: Mocked<Pick<WechatService, 'miniAppLogin' | 'getPhoneNumber'>>;
    let notificationsService: Mocked<Pick<NotificationsService, 'initializeDefaultSettings'>>;
    let service: AuthService;

    function buildUser(overrides: Partial<User> = {}): User {
      return { id: 1, role: { id: 2 }, status: { id: StatusEnum.active }, ...overrides } as User;
    }

    function rejectionErrors(error: unknown): unknown {
      expect(error).toBeInstanceOf(UnprocessableEntityException);
      return ((error as UnprocessableEntityException).getResponse() as { errors: unknown }).errors;
    }

    beforeEach(async () => {
      usersService = {
        findByWechatOpenId: vi.fn().mockResolvedValue(null),
        findByPhone: vi.fn().mockResolvedValue(null),
        findById: vi.fn(),
        create: vi.fn(),
        bindPhoneIfEmpty: vi.fn().mockResolvedValue(true),
        bindWechatIfEmpty: vi.fn().mockResolvedValue(true),
      };
      wechatService = {
        miniAppLogin: vi.fn().mockResolvedValue({ openId: 'OPEN1', unionId: 'UNION1' }),
        getPhoneNumber: vi.fn().mockResolvedValue({ purePhoneNumber: PHONE, countryCode: '86' }),
      };
      notificationsService = { initializeDefaultSettings: vi.fn() };
      const sessionService = { create: vi.fn().mockResolvedValue({ id: 10 }) };
      const tokenService = {
        generateSessionHash: vi.fn().mockReturnValue('H'),
        getTokensData: vi.fn().mockResolvedValue({ token: 't', refreshToken: 'r', tokenExpires: 1 }),
      };

      const moduleRef = await Test.createTestingModule({ providers: [AuthService] })
        .useMocker((token) => {
          if (token === UsersService) return usersService;
          if (token === WechatService) return wechatService;
          if (token === NotificationsService) return notificationsService;
          if (token === SessionService) return sessionService;
          if (token === TokenService) return tokenService;
          return {};
        })
        .compile();
      service = moduleRef.get(AuthService);
    });

    it('should create a user with both the openId and the phone when neither exists', async () => {
      usersService.create.mockResolvedValue(buildUser({ id: 5 }));

      const result = await service.wechatPhoneLogin(dto);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ wechatOpenId: 'OPEN1', wechatUnionId: 'UNION1', phone: PHONE }),
      );
      expect(notificationsService.initializeDefaultSettings).toHaveBeenCalledWith(5);
      expect(result.user.id).toBe(5);
    });

    it('should bind the phone to the WeChat user without a phone', async () => {
      usersService.findByWechatOpenId.mockResolvedValue(buildUser({ id: 1, phone: null }));
      usersService.findById.mockResolvedValue(buildUser({ id: 1, phone: PHONE }));

      const result = await service.wechatPhoneLogin(dto);

      expect(usersService.bindPhoneIfEmpty).toHaveBeenCalledWith(1, PHONE);
      expect(result.user.phone).toBe(PHONE);
    });

    it('should keep the existing phone of the WeChat user', async () => {
      usersService.findByWechatOpenId.mockResolvedValue(buildUser({ id: 1, phone: '13900000000' }));

      const result = await service.wechatPhoneLogin(dto);

      expect(usersService.bindPhoneIfEmpty).not.toHaveBeenCalled();
      expect(result.user.phone).toBe('13900000000');
    });

    it('should bind the WeChat account to the phone user without a WeChat account', async () => {
      usersService.findByPhone.mockResolvedValue(buildUser({ id: 2, phone: PHONE, wechatOpenId: null }));
      usersService.findById.mockResolvedValue(buildUser({ id: 2, phone: PHONE, wechatOpenId: 'OPEN1' }));

      const result = await service.wechatPhoneLogin(dto);

      expect(usersService.bindWechatIfEmpty).toHaveBeenCalledWith(2, 'OPEN1', 'UNION1');
      expect(result.user.id).toBe(2);
    });

    it('should log in when the openId and the phone belong to the same user', async () => {
      const user = buildUser({ id: 3, phone: PHONE, wechatOpenId: 'OPEN1' });
      usersService.findByWechatOpenId.mockResolvedValue(user);
      usersService.findByPhone.mockResolvedValue(user);

      const result = await service.wechatPhoneLogin(dto);

      expect(result.user.id).toBe(3);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should reject when the openId and the phone belong to different users', async () => {
      usersService.findByWechatOpenId.mockResolvedValue(buildUser({ id: 1 }));
      usersService.findByPhone.mockResolvedValue(buildUser({ id: 2, phone: PHONE }));

      const error = await service.wechatPhoneLogin(dto).catch((e: unknown) => e);

      expect(rejectionErrors(error)).toEqual({ phone: 'boundToOtherWechat' });
    });

    it('should reject when the phone user is bound to another WeChat account', async () => {
      usersService.findByPhone.mockResolvedValue(buildUser({ id: 2, phone: PHONE, wechatOpenId: 'OPEN2' }));

      const error = await service.wechatPhoneLogin(dto).catch((e: unknown) => e);

      expect(rejectionErrors(error)).toEqual({ phone: 'boundToOtherWechat' });
      expect(usersService.bindWechatIfEmpty).not.toHaveBeenCalled();
    });

    it('should not bind the WeChat account to a phone user whose status does not allow login', async () => {
      usersService.findByPhone.mockResolvedValue(
        buildUser({ id: 2, phone: PHONE, wechatOpenId: null, status: { id: 99 } }),
      );

      const error = await service.wechatPhoneLogin(dto).catch((e: unknown) => e);

      expect(rejectionErrors(error)).toEqual({ wechat: 'userNotActive' });
      expect(usersService.bindWechatIfEmpty).not.toHaveBeenCalled();
    });

    it('should reject phone numbers outside mainland China', async () => {
      wechatService.getPhoneNumber.mockResolvedValue({ purePhoneNumber: '91234567', countryCode: '852' });

      const error = await service.wechatPhoneLogin(dto).catch((e: unknown) => e);

      expect(rejectionErrors(error)).toEqual({ phone: 'unsupportedRegion' });
    });

    it('should look up again when a concurrent request created the user first', async () => {
      const created = buildUser({ id: 7, phone: PHONE, wechatOpenId: 'OPEN1' });
      usersService.create.mockRejectedValue(new Error('duplicate key'));
      usersService.findByWechatOpenId.mockResolvedValueOnce(null).mockResolvedValueOnce(created);
      usersService.findByPhone.mockResolvedValueOnce(null).mockResolvedValueOnce(created);

      const result = await service.wechatPhoneLogin(dto);

      expect(result.user.id).toBe(7);
    });

    it('should throw when the second attempt still conflicts', async () => {
      usersService.create.mockRejectedValue(new Error('duplicate key'));

      await expect(service.wechatPhoneLogin(dto)).rejects.toThrow('duplicate key');
      expect(usersService.create).toHaveBeenCalledTimes(2);
    });
  });
});

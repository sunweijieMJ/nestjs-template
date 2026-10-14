import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { SessionService } from '../session/session.service';
import { UsersService } from '../users/users.service';
import { TokenService } from './services/token.service';
import { StatusEnum } from '../../common/enums/statuses/statuses.enum';

describe('AuthService', () => {
  describe('refreshToken', () => {
    let sessionService: jest.Mocked<
      Pick<SessionService, 'findById' | 'rotateHash' | 'wasRecentlyRotatedFrom' | 'revoke'>
    >;
    let tokenService: jest.Mocked<Pick<TokenService, 'generateSessionHash' | 'getTokensData'>>;
    let service: AuthService;

    beforeEach(async () => {
      sessionService = {
        findById: jest.fn().mockResolvedValue({ id: 10, hash: 'H1', user: { id: 1 } }),
        rotateHash: jest.fn().mockResolvedValue(true),
        wasRecentlyRotatedFrom: jest.fn().mockResolvedValue(false),
        revoke: jest.fn(),
      };
      tokenService = {
        generateSessionHash: jest.fn().mockReturnValue('H2'),
        getTokensData: jest.fn().mockResolvedValue({ token: 't', refreshToken: 'r', tokenExpires: 1 }),
      };
      const usersService = {
        findById: jest.fn().mockResolvedValue({ id: 1, role: { id: 2 }, status: { id: StatusEnum.active } }),
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
});

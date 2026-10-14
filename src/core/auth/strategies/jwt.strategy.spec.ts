import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';
import { SessionService } from '../../session/session.service';
import { StatusEnum } from '../../../common/enums/statuses/statuses.enum';
import { JwtPayloadType } from './types/jwt-payload.type';

function createStrategy(
  session: unknown,
  roleId: number | null = 2,
): { strategy: JwtStrategy; cache: Map<string, unknown> } {
  const cache = new Map<string, unknown>();
  const cacheManager = {
    get: async (key: string) => cache.get(key),
    set: async (key: string, value: unknown) => cache.set(key, value),
  } as unknown as Cache;
  const configService = { getOrThrow: () => 'secret' } as unknown as ConfigService;
  const usersService = {
    findById: async () => ({
      id: 1,
      status: { id: StatusEnum.active },
      role: roleId === null ? null : { id: roleId },
    }),
  } as unknown as UsersService;
  const sessionService = { findById: async () => session } as unknown as SessionService;

  return { strategy: new JwtStrategy(configService, usersService, sessionService, cacheManager), cache };
}

const payload = { id: 1, sessionId: 10, role: { id: 1 } } as JwtPayloadType;

describe('JwtStrategy', () => {
  it('should accept the token when its session exists', async () => {
    const { strategy } = createStrategy({ id: 10, user: { id: 1 } });
    await expect(strategy.validate(payload)).resolves.toMatchObject({ id: 1, sessionId: 10 });
  });

  it('should use the current role of the user instead of the role in the token', async () => {
    const { strategy } = createStrategy({ id: 10, user: { id: 1 } }, 2);
    await expect(strategy.validate(payload)).resolves.toMatchObject({ role: { id: 2 } });
  });

  it('should drop the role in the token when the user no longer has a role', async () => {
    const { strategy } = createStrategy({ id: 10, user: { id: 1 } }, null);
    await expect(strategy.validate(payload)).resolves.toMatchObject({ role: null });
  });

  it('should use the cached role on later requests', async () => {
    const { strategy, cache } = createStrategy({ id: 10, user: { id: 1 } }, 2);
    await strategy.validate(payload);
    cache.set('jwt:session:10', { statusId: StatusEnum.active, roleId: 3 });

    await expect(strategy.validate(payload)).resolves.toMatchObject({ role: { id: 3 } });
  });

  it('should reject the token when its session has been deleted', async () => {
    const { strategy } = createStrategy(null);
    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should reject the token when the session belongs to another user', async () => {
    const { strategy } = createStrategy({ id: 10, user: { id: 2 } });
    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

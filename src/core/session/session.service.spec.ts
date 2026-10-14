import { Cache } from 'cache-manager';
import { SessionService, sessionAuthCacheKey } from './session.service';
import { SessionRepository } from './infrastructure/persistence/session.repository';

describe('SessionService', () => {
  let repository: jest.Mocked<Pick<SessionRepository, 'rotateHash' | 'deleteById'>>;
  let cache: Map<string, unknown>;
  let service: SessionService;

  beforeEach(() => {
    repository = { rotateHash: jest.fn(), deleteById: jest.fn() };
    cache = new Map();
    const cacheManager = {
      get: async (key: string) => cache.get(key),
      set: async (key: string, value: unknown) => cache.set(key, value),
      del: async (key: string) => cache.delete(key),
    } as unknown as Cache;
    service = new SessionService(repository as unknown as SessionRepository, cacheManager);
  });

  it('should remember the previous hash after a successful rotation', async () => {
    repository.rotateHash.mockResolvedValue(true);

    await expect(service.rotateHash(10, 'H1', 'H2')).resolves.toBe(true);

    await expect(service.wasRecentlyRotatedFrom(10, 'H1')).resolves.toBe(true);
    await expect(service.wasRecentlyRotatedFrom(10, 'H0')).resolves.toBe(false);
  });

  it('should not remember the hash when the rotation lost the race', async () => {
    repository.rotateHash.mockResolvedValue(false);

    await service.rotateHash(10, 'H1', 'H2');

    await expect(service.wasRecentlyRotatedFrom(10, 'H1')).resolves.toBe(false);
  });

  it('should clear the token validation cache when revoking', async () => {
    cache.set(sessionAuthCacheKey(10), { statusId: 1 });

    await service.revoke(10);

    expect(repository.deleteById).toHaveBeenCalledWith(10);
    expect(cache.has(sessionAuthCacheKey(10))).toBe(false);
  });
});

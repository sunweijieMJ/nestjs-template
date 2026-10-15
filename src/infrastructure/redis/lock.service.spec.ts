import { ConfigService } from '@nestjs/config';
import { LockService } from './lock.service';

function createLocalLockService(): LockService {
  return new LockService({ get: () => false } as unknown as ConfigService);
}

function withRedisClient(service: LockService, client: { set: unknown; eval: unknown }): LockService {
  return Object.assign(service, { client });
}

describe('LockService', () => {
  describe('without Redis', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('should grant a key to only one holder until it is released', async () => {
      const service = createLocalLockService();

      const token = await service.tryAcquire('k', 1000);

      expect(token).toEqual(expect.any(String));
      await expect(service.tryAcquire('k', 1000)).resolves.toBeNull();
      await service.release('k', token!);
      await expect(service.tryAcquire('k', 1000)).resolves.toEqual(expect.any(String));
    });

    it('should keep the key when released with another token', async () => {
      const service = createLocalLockService();
      await service.tryAcquire('k', 1000);

      await service.release('k', 'other');

      await expect(service.tryAcquire('k', 1000)).resolves.toBeNull();
    });

    it('should free the key after the ttl', async () => {
      vi.useFakeTimers();
      const service = createLocalLockService();
      await service.tryAcquire('k', 1000);

      vi.advanceTimersByTime(1000);

      await expect(service.tryAcquire('k', 1000)).resolves.toEqual(expect.any(String));
    });
  });

  describe('with Redis', () => {
    it('should acquire with SET NX PX and release only its own token', async () => {
      const client = { set: vi.fn().mockResolvedValue('OK'), eval: vi.fn().mockResolvedValue(1) };
      const service = withRedisClient(createLocalLockService(), client);

      const token = await service.tryAcquire('k', 1000);
      await service.release('k', token!);

      expect(client.set).toHaveBeenCalledWith('k', token, 'PX', 1000, 'NX');
      expect(client.eval).toHaveBeenCalledWith(expect.any(String), 1, 'k', token);
    });

    it('should report the key as taken when SET NX fails', async () => {
      const client = { set: vi.fn().mockResolvedValue(null), eval: vi.fn() };
      const service = withRedisClient(createLocalLockService(), client);

      await expect(service.tryAcquire('k', 1000)).resolves.toBeNull();
    });

    it('should fall back to a local lock when Redis is unavailable', async () => {
      const client = { set: vi.fn().mockRejectedValue(new Error('down')), eval: vi.fn().mockResolvedValue(0) };
      const service = withRedisClient(createLocalLockService(), client);

      await expect(service.tryAcquire('k', 1000)).resolves.toEqual(expect.any(String));
      await expect(service.tryAcquire('k', 1000)).resolves.toBeNull();
    });
  });
});

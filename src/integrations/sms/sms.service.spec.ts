import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { SmsService, SmsCodeType } from './sms.service';
import { AliyunSmsProvider } from './providers/aliyun-sms.provider';
import { LockService } from '../../infrastructure/redis/lock.service';

/** 每次读写都异步让出且读出新对象，模拟远程缓存 */
function createAsyncCache(): Cache {
  const store = new Map<string, unknown>();
  const tick = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));
  return {
    get: async (key: string) => {
      await tick();
      return structuredClone(store.get(key));
    },
    set: async (key: string, value: unknown) => {
      await tick();
      store.set(key, structuredClone(value));
      return value;
    },
    del: async (key: string) => {
      await tick();
      return store.delete(key);
    },
  } as unknown as Cache;
}

function createLockService(): LockService {
  return new LockService({ get: () => false } as unknown as ConfigService);
}

describe('SmsService', () => {
  describe('sendCode', () => {
    const configService = { get: () => undefined } as unknown as ConfigService;

    it('should send only one SMS for concurrent requests to the same phone', async () => {
      const provider = { sendSms: vi.fn().mockResolvedValue({ success: true }) };
      const service = new SmsService(
        configService,
        provider as unknown as AliyunSmsProvider,
        createAsyncCache(),
        createLockService(),
      );

      const results = await Promise.all(
        Array.from({ length: 5 }, () => service.sendCode('13800000000', SmsCodeType.LOGIN)),
      );

      expect(provider.sendSms).toHaveBeenCalledTimes(1);
      expect(results.filter((result) => result.success)).toHaveLength(1);
      expect(results.filter((result) => result.retryAfter)).toHaveLength(4);
    });

    it('should allow an immediate retry after the provider fails', async () => {
      const provider = {
        sendSms: vi
          .fn()
          .mockResolvedValueOnce({ success: false, message: 'busy' })
          .mockResolvedValueOnce({ success: true }),
      };
      const service = new SmsService(
        configService,
        provider as unknown as AliyunSmsProvider,
        createAsyncCache(),
        createLockService(),
      );

      await expect(service.sendCode('13800000000', SmsCodeType.LOGIN)).resolves.toMatchObject({ success: false });
      await expect(service.sendCode('13800000000', SmsCodeType.LOGIN)).resolves.toMatchObject({ success: true });
    });
  });

  describe('sendCode storage failure', () => {
    it('should allow an immediate retry when storing the code fails', async () => {
      const configService = { get: () => undefined } as unknown as ConfigService;
      const provider = { sendSms: vi.fn().mockResolvedValue({ success: true }) };
      const cache = createAsyncCache();
      const set = vi.spyOn(cache, 'set').mockRejectedValueOnce(new Error('cache down'));
      const service = new SmsService(
        configService,
        provider as unknown as AliyunSmsProvider,
        cache,
        createLockService(),
      );

      await expect(service.sendCode('13800000000', SmsCodeType.LOGIN)).rejects.toThrow('cache down');
      set.mockRestore();
      await expect(service.sendCode('13800000000', SmsCodeType.LOGIN)).resolves.toMatchObject({ success: true });
    });
  });

  describe('verifyCode', () => {
    it('should count concurrent wrong attempts towards the attempt limit', async () => {
      const cache = createAsyncCache();
      const configService = { get: () => undefined } as unknown as ConfigService;
      const service = new SmsService(configService, {} as AliyunSmsProvider, cache, createLockService());
      await cache.set('sms:code:login:13800000000', { code: '123456', attempts: 0, createdAt: Date.now() });

      await Promise.all(
        Array.from({ length: 10 }, () => service.verifyCode('13800000000', '000000', SmsCodeType.LOGIN)),
      );

      await expect(service.verifyCode('13800000000', '123456', SmsCodeType.LOGIN)).resolves.toMatchObject({
        success: false,
      });
    });

    it('should accept the correct code', async () => {
      const cache = createAsyncCache();
      const configService = { get: () => undefined } as unknown as ConfigService;
      const service = new SmsService(configService, {} as AliyunSmsProvider, cache, createLockService());
      await cache.set('sms:code:login:13800000000', { code: '123456', attempts: 0, createdAt: Date.now() });

      await expect(service.verifyCode('13800000000', '123456', SmsCodeType.LOGIN)).resolves.toMatchObject({
        success: true,
      });
    });
  });
});

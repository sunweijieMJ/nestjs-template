import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { SmsService, SmsCodeType } from './sms.service';
import { AliyunSmsProvider } from './providers/aliyun-sms.provider';

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

describe('SmsService', () => {
  describe('verifyCode', () => {
    it('should count concurrent wrong attempts towards the attempt limit', async () => {
      const cache = createAsyncCache();
      const configService = { get: () => undefined } as unknown as ConfigService;
      const service = new SmsService(configService, {} as AliyunSmsProvider, cache);
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
      const service = new SmsService(configService, {} as AliyunSmsProvider, cache);
      await cache.set('sms:code:login:13800000000', { code: '123456', attempts: 0, createdAt: Date.now() });

      await expect(service.verifyCode('13800000000', '123456', SmsCodeType.LOGIN)).resolves.toMatchObject({
        success: true,
      });
    });
  });
});

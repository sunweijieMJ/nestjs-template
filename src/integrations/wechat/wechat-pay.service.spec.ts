import * as crypto from 'crypto';
import { ConfigType } from '@nestjs/config';
import { WechatPayService, WechatEncryptedResource } from './wechat-pay.service';
import wechatConfig from './config/wechat.config';

const API_V3_KEY = '0123456789abcdef0123456789abcdef';

function createService(pay: Record<string, string> = {}): WechatPayService {
  const config = { pay: { mchId: '1900000001', apiV3Key: API_V3_KEY, ...pay } } as unknown as ConfigType<
    typeof wechatConfig
  >;
  return new WechatPayService(config);
}

function encrypt(plaintext: string, associatedData = 'transaction'): WechatEncryptedResource {
  const nonce = 'abcdefghijkl';
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(API_V3_KEY, 'utf8'), nonce);
  cipher.setAAD(Buffer.from(associatedData, 'utf8'));
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final(), cipher.getAuthTag()]);
  return { ciphertext: encrypted.toString('base64'), nonce, associated_data: associatedData };
}

function signedHeaders(privateKey: crypto.KeyObject, body: string, serial: string): Record<string, string> {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = 'nonce';
  const signature = crypto.sign('RSA-SHA256', Buffer.from(`${timestamp}\n${nonce}\n${body}\n`), privateKey);
  return {
    'wechatpay-signature': signature.toString('base64'),
    'wechatpay-timestamp': timestamp,
    'wechatpay-nonce': nonce,
    'wechatpay-serial': serial,
  };
}

describe('WechatPayService', () => {
  describe('verifyNotify', () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const body = JSON.stringify({ resource: encrypt('{}') });

    it('should reject the notification when the platform certificate is not loaded', async () => {
      const service = createService();
      await expect(service.verifyNotify(signedHeaders(privateKey, body, 'unknown'), body)).resolves.toEqual({
        isValid: false,
      });
    });

    it('should accept the notification signed by the loaded platform key', async () => {
      const service = createService();
      service.setPlatformCertificate('SERIAL', publicKey.export({ type: 'spki', format: 'pem' }).toString());

      const result = await service.verifyNotify(signedHeaders(privateKey, body, 'SERIAL'), body);

      expect(result.isValid).toBe(true);
    });

    it('should reject the notification when the body is tampered', async () => {
      const service = createService();
      service.setPlatformCertificate('SERIAL', publicKey.export({ type: 'spki', format: 'pem' }).toString());

      const result = await service.verifyNotify(signedHeaders(privateKey, body, 'SERIAL'), `${body} `);

      expect(result.isValid).toBe(false);
    });
  });

  describe('platform keys', () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
    const body = '{}';
    const certificateConfig = { privateKey: 'key', serialNo: 'MCH_SERIAL' };

    it('should verify with the configured WeChat Pay public key', async () => {
      const service = createService({ publicKeyId: 'PUB_KEY_ID_1', publicKey: publicKeyPem });
      service.onModuleInit();

      const result = await service.verifyNotify(signedHeaders(privateKey, body, 'PUB_KEY_ID_1'), body);

      expect(result.isValid).toBe(true);
    });

    it('should download certificates once per interval when the serial is unknown', async () => {
      const service = createService(certificateConfig);
      const refresh = jest.spyOn(service, 'refreshPlatformCertificates').mockImplementation(async () => {
        service.setPlatformCertificate('NEW_SERIAL', publicKeyPem);
        Object.assign(service, { lastCertificateRefresh: Date.now() });
      });

      await expect(service.verifyNotify(signedHeaders(privateKey, body, 'NEW_SERIAL'), body)).resolves.toMatchObject({
        isValid: true,
      });
      await service.verifyNotify(signedHeaders(privateKey, body, 'OTHER_SERIAL'), body);

      expect(refresh).toHaveBeenCalledTimes(1);
    });

    it('should not download certificates for a public key serial', async () => {
      const service = createService(certificateConfig);
      const refresh = jest.spyOn(service, 'refreshPlatformCertificates').mockResolvedValue();

      await service.verifyNotify(signedHeaders(privateKey, body, 'PUB_KEY_ID_UNKNOWN'), body);

      expect(refresh).not.toHaveBeenCalled();
    });
  });

  describe('parseTransactionResource', () => {
    it('should decrypt the transaction of the configured merchant', () => {
      const service = createService();
      const transaction = {
        mchid: '1900000001',
        out_trade_no: 'ORD1',
        trade_state: 'SUCCESS',
        amount: { total: 9900 },
      };

      expect(service.parseTransactionResource(encrypt(JSON.stringify(transaction)))).toMatchObject(transaction);
    });

    it('should throw when the transaction belongs to another merchant', () => {
      const service = createService();
      const resource = encrypt(JSON.stringify({ mchid: 'other', out_trade_no: 'ORD1' }));

      expect(() => service.parseTransactionResource(resource)).toThrow();
    });

    it('should throw when the associated data does not match', () => {
      const service = createService();
      const resource = encrypt(JSON.stringify({ mchid: '1900000001' }));

      expect(() => service.parseTransactionResource({ ...resource, associated_data: 'other' })).toThrow();
    });
  });

  describe('queryOrder', () => {
    it('should URL-encode the order number in the request path', async () => {
      const service = createService();
      const request = jest.fn().mockResolvedValue({});
      Object.assign(service, { request });

      await service.queryOrder('../../refund/domestic/refunds/X?');

      expect(request).toHaveBeenCalledWith(
        'GET',
        'https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/..%2F..%2Frefund%2Fdomestic%2Frefunds%2FX%3F?mchid=1900000001',
      );
    });
  });
});

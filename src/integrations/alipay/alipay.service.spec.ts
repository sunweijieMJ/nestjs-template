import type { Mock } from 'vitest';
import { UnprocessableEntityException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { AlipayService } from './alipay.service';
import alipayConfig from './config/alipay.config';

function createServiceWithResponse(response: unknown, config: Record<string, string> = {}): AlipayService {
  const service = new AlipayService({
    appId: 'app',
    privateKey: 'key',
    gateway: 'https://openapi.alipay.com/gateway.do',
    charset: 'utf-8',
    signType: 'RSA2',
    notifyUrl: '',
    returnUrl: '',
    ...config,
  } as unknown as ConfigType<typeof alipayConfig>);
  Object.assign(service, {
    sign: vi.fn().mockReturnValue('sign'),
    sendRequest: vi.fn().mockResolvedValue(response),
  });
  return service;
}

function sentParams(service: AlipayService): Record<string, string> {
  return (service as unknown as { sendRequest: Mock }).sendRequest.mock.calls[0][0] as Record<string, string>;
}

function errorsOf(error: unknown): unknown {
  expect(error).toBeInstanceOf(UnprocessableEntityException);
  return (error as UnprocessableEntityException).getResponse();
}

function createService(refundResponse: Record<string, string>): AlipayService {
  const service = new AlipayService({
    appId: 'app',
    gateway: 'https://openapi.alipay.com/gateway.do',
    charset: 'utf-8',
    signType: 'RSA2',
    notifyUrl: '',
    returnUrl: '',
  } as unknown as ConfigType<typeof alipayConfig>);
  Object.assign(service, {
    sign: vi.fn().mockReturnValue('sign'),
    sendRequest: vi.fn().mockResolvedValue({ alipay_trade_refund_response: refundResponse }),
  });
  return service;
}

describe('AlipayService', () => {
  describe('refund', () => {
    const params = { outTradeNo: 'ORD1', refundAmount: '99.00', outRequestNo: 'ORD1_R1' };

    it('should return the response when the business code is 10000', async () => {
      const service = createService({ code: '10000', msg: 'Success', out_trade_no: 'ORD1' });
      await expect(service.refund(params)).resolves.toMatchObject({ out_trade_no: 'ORD1' });
    });

    it('should throw 422 when the business code is not 10000', async () => {
      const service = createService({ code: '40004', msg: 'Business Failed', sub_msg: '交易状态不合法' });
      await expect(service.refund(params)).rejects.toBeInstanceOf(UnprocessableEntityException);
    });
  });

  describe('Beijing time', () => {
    const originalTz = process.env.TZ;

    beforeEach(() => {
      process.env.TZ = 'America/New_York';
    });

    afterEach(() => {
      vi.useRealTimers();
      process.env.TZ = originalTz;
    });

    it('should send the request timestamp in Beijing time regardless of the server time zone', async () => {
      vi.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));
      const service = createService({ code: '10000', msg: 'Success' });

      await service.refund({ outTradeNo: 'ORD1', refundAmount: '1.00', outRequestNo: 'R1' });

      const [params] = (service as unknown as { sendRequest: Mock }).sendRequest.mock.calls[0];
      expect(params.timestamp).toBe('2026-01-01 08:00:00');
    });

    it('should send the payment deadline in Beijing time', () => {
      const service = createService({});
      const form = service.createWebPayment({
        outTradeNo: 'ORD1',
        subject: 'S',
        totalAmount: '1.00',
        timeExpire: new Date('2026-01-01T00:30:00Z'),
      });

      expect(form).toContain('2026-01-01 08:30:00');
    });
  });

  describe('exchangeAuthCode', () => {
    it('should send grant_type and code as top-level parameters and return the open_id', async () => {
      const service = createServiceWithResponse({
        alipay_system_oauth_token_response: { open_id: 'OPEN1', access_token: 'T', expires_in: 1 },
      });

      await expect(service.exchangeAuthCode('C1')).resolves.toEqual({ openId: 'OPEN1' });

      const params = sentParams(service);
      expect(params).toMatchObject({
        method: 'alipay.system.oauth.token',
        grant_type: 'authorization_code',
        code: 'C1',
      });
      expect(params.biz_content).toBeUndefined();
    });

    it('should not retry the one-time auth code exchange', async () => {
      const service = createServiceWithResponse({
        alipay_system_oauth_token_response: { open_id: 'OPEN1', access_token: 'T', expires_in: 1 },
      });

      await service.exchangeAuthCode('C1');

      const [, retryOptions] = (service as unknown as { sendRequest: Mock }).sendRequest.mock.calls[0];
      expect(retryOptions).toEqual({ maxRetries: 0 });
    });

    it('should report a request failure when the app returns only user_id', async () => {
      const service = createServiceWithResponse({
        alipay_system_oauth_token_response: { user_id: '2088000000000001', access_token: 'T', expires_in: 1 },
      });

      const error = await service.exchangeAuthCode('C1').catch((e: unknown) => e);

      expect(errorsOf(error)).toMatchObject({ errors: { alipay: 'requestFailed' } });
    });

    it('should reject an invalid auth code with a field error', async () => {
      const service = createServiceWithResponse({
        error_response: { code: '40002', msg: 'Invalid Arguments', sub_code: 'isv.code-invalid' },
      });

      const error = await service.exchangeAuthCode('BAD').catch((e: unknown) => e);

      expect(errorsOf(error)).toMatchObject({ error: 'invalidAlipayAuthCode', errors: { authCode: 'invalidCode' } });
    });

    it('should report a request failure for other Alipay errors', async () => {
      const service = createServiceWithResponse({
        error_response: {
          code: '40006',
          msg: 'Insufficient Permissions',
          sub_code: 'isv.insufficient-isv-permissions',
        },
      });

      const error = await service.exchangeAuthCode('C1').catch((e: unknown) => e);

      expect(errorsOf(error)).toMatchObject({ errors: { alipay: 'requestFailed' } });
    });

    it('should report a request failure when the request throws', async () => {
      const service = createServiceWithResponse(undefined);
      (service as unknown as { sendRequest: Mock }).sendRequest.mockRejectedValue(new Error('timeout'));

      const error = await service.exchangeAuthCode('C1').catch((e: unknown) => e);

      expect(errorsOf(error)).toMatchObject({ errors: { alipay: 'requestFailed' } });
    });

    it('should report not configured when the credentials are missing', async () => {
      const service = createServiceWithResponse({}, { privateKey: '' });

      const error = await service.exchangeAuthCode('C1').catch((e: unknown) => e);

      expect(errorsOf(error)).toMatchObject({ errors: { alipay: 'notConfigured' } });
    });
  });

  describe('createMiniProgramPayment', () => {
    const payment = { outTradeNo: 'ORD1', subject: 'S', totalAmount: '99.00' };

    it('should create a JSAPI trade for the buyer and return the trade number', async () => {
      const service = createServiceWithResponse(
        { alipay_trade_create_response: { code: '10000', msg: 'Success', trade_no: 'T1', out_trade_no: 'ORD1' } },
        { notifyUrl: 'https://api.example.com/alipay/notify' },
      );

      await expect(
        service.createMiniProgramPayment({
          ...payment,
          buyerOpenId: 'OPEN1',
          timeExpire: new Date('2026-01-01T00:30:00Z'),
        }),
      ).resolves.toBe('T1');

      const params = sentParams(service);
      expect(params.method).toBe('alipay.trade.create');
      expect(params.notify_url).toBe('https://api.example.com/alipay/notify');
      expect(JSON.parse(params.biz_content)).toMatchObject({
        out_trade_no: 'ORD1',
        product_code: 'JSAPI_PAY',
        total_amount: '99.00',
        buyer_open_id: 'OPEN1',
        time_expire: '2026-01-01 08:30:00',
      });
    });

    it('should report the trade as inconsistent when the order was created with different trade info', async () => {
      const service = createServiceWithResponse({
        alipay_trade_create_response: {
          code: '40004',
          msg: 'Business Failed',
          sub_code: 'ACQ.CONTEXT_INCONSISTENT',
          sub_msg: '交易信息被篡改',
        },
      });

      const error = await service
        .createMiniProgramPayment({ ...payment, buyerOpenId: 'OPEN1' })
        .catch((e: unknown) => e);

      expect(errorsOf(error)).toMatchObject({
        error: 'alipayTradeInconsistent',
        errors: { outTradeNo: 'tradeInconsistent' },
      });
    });

    it('should report a request failure when the request throws', async () => {
      const service = createServiceWithResponse(undefined);
      (service as unknown as { sendRequest: Mock }).sendRequest.mockRejectedValue(new Error('timeout'));

      const error = await service
        .createMiniProgramPayment({ ...payment, buyerOpenId: 'OPEN1' })
        .catch((e: unknown) => e);

      expect(errorsOf(error)).toMatchObject({ errors: { alipay: 'requestFailed' } });
    });

    it('should throw 422 when the gateway returns an error response', async () => {
      const service = createServiceWithResponse({
        error_response: { code: '40002', msg: 'Invalid Arguments', sub_code: 'isv.invalid-signature' },
      });

      await expect(service.createMiniProgramPayment({ ...payment, buyerOpenId: 'OPEN1' })).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });

    it('should throw 422 when the business code is not 10000', async () => {
      const service = createServiceWithResponse({
        alipay_trade_create_response: { code: '40004', msg: 'Business Failed', sub_msg: '交易已支付' },
      });

      await expect(service.createMiniProgramPayment({ ...payment, buyerOpenId: 'OPEN1' })).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });
  });

  describe('web payment return_url', () => {
    const payment = { outTradeNo: 'ORD1', subject: 'S', totalAmount: '99.00' };

    it('should append the return query to the configured return_url', () => {
      const service = createServiceWithResponse(
        {},
        { returnUrl: 'https://h5.example.com/pages-sub/order/payment-result/index' },
      );

      const form = service.createMobilePayment({ ...payment, returnQuery: { orderId: '12' } });

      expect(form).toContain('value="https://h5.example.com/pages-sub/order/payment-result/index?orderId=12"');
    });

    it('should append to an existing query string and keep the hash at the end', () => {
      const service = createServiceWithResponse({}, { returnUrl: 'https://h5.example.com/result?from=alipay#top' });

      const form = service.createWebPayment({ ...payment, returnQuery: { orderId: '12' } });

      expect(form).toContain('value="https://h5.example.com/result?from=alipay&amp;orderId=12#top"');
    });

    it('should omit return_url when it is not configured', () => {
      const service = createServiceWithResponse({}, { returnUrl: '' });

      const form = service.createWebPayment({ ...payment, returnQuery: { orderId: '12' } });

      expect(form).toContain('name="return_url" value=""');
      expect(form).not.toContain('orderId=12');
    });

    it('should not send return_url for the mini program trade', async () => {
      const service = createServiceWithResponse(
        { alipay_trade_create_response: { code: '10000', msg: 'Success', trade_no: 'T1', out_trade_no: 'ORD1' } },
        { returnUrl: 'https://h5.example.com/result' },
      );

      await service.createMiniProgramPayment({ ...payment, buyerOpenId: 'OPEN1', returnQuery: { orderId: '12' } });

      expect(sentParams(service).return_url).toBeUndefined();
    });
  });
});

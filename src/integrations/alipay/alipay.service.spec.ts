import { UnprocessableEntityException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { AlipayService } from './alipay.service';
import alipayConfig from './config/alipay.config';

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
    sign: jest.fn().mockReturnValue('sign'),
    sendRequest: jest.fn().mockResolvedValue({ alipay_trade_refund_response: refundResponse }),
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
      jest.useRealTimers();
      process.env.TZ = originalTz;
    });

    it('should send the request timestamp in Beijing time regardless of the server time zone', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));
      const service = createService({ code: '10000', msg: 'Success' });

      await service.refund({ outTradeNo: 'ORD1', refundAmount: '1.00', outRequestNo: 'R1' });

      const [params] = (service as unknown as { sendRequest: jest.Mock }).sendRequest.mock.calls[0];
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
});

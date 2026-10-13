import { UnprocessableEntityException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { AlipayService } from './alipay.service';
import alipayConfig from './config/alipay.config';

function createService(refundResponse: Record<string, string>): AlipayService {
  const service = new AlipayService({ appId: 'app' } as unknown as ConfigType<typeof alipayConfig>);
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
});

import type { Mocked } from 'vitest';
import { WechatPayController } from './wechat-pay.controller';
import { WechatPayService } from '../../integrations/wechat/wechat-pay.service';
import { WechatService } from '../../integrations/wechat/wechat.service';
import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from './payments.service';
import { Order, OrderStatus } from '../orders/domain/order';
import type { RequestWithUser } from '../../common/types/request-with-user.type';

describe('WechatPayController', () => {
  describe('createJsapiPayment', () => {
    let wechatPayService: Mocked<Pick<WechatPayService, 'createJsapiPayment'>>;
    let wechatService: Mocked<Pick<WechatService, 'miniAppLogin'>>;
    let ordersService: Mocked<Pick<OrdersService, 'findPayableOrder'>>;
    let controller: WechatPayController;

    const order = {
      id: 1,
      userId: 10,
      orderNo: 'ORD1',
      status: OrderStatus.UNPAID,
      totalAmount: 9900,
      expiresAt: new Date('2026-01-01T00:30:00Z'),
    } as Order;
    const request = { user: { id: 10 } } as unknown as RequestWithUser;

    beforeEach(() => {
      wechatPayService = { createJsapiPayment: vi.fn().mockResolvedValue({ paySign: 'S' }) };
      wechatService = { miniAppLogin: vi.fn().mockResolvedValue({ openId: 'OPEN1' }) };
      ordersService = { findPayableOrder: vi.fn().mockResolvedValue(order) };
      controller = new WechatPayController(
        wechatPayService as unknown as WechatPayService,
        wechatService as unknown as WechatService,
        ordersService as unknown as OrdersService,
        {} as PaymentsService,
      );
    });

    it('should resolve the openid from the login code and order with the order amount', async () => {
      await controller.createJsapiPayment(request, { code: 'C1', outTradeNo: 'ORD1', description: '订单 ORD1' });

      expect(ordersService.findPayableOrder).toHaveBeenCalledWith('ORD1', 10);
      expect(wechatService.miniAppLogin).toHaveBeenCalledWith('C1');
      expect(wechatPayService.createJsapiPayment).toHaveBeenCalledWith({
        openid: 'OPEN1',
        outTradeNo: 'ORD1',
        description: '订单 ORD1',
        amount: 9900,
        timeExpire: order.expiresAt,
      });
    });

    it('should not create the payment when the login code is invalid', async () => {
      wechatService.miniAppLogin.mockRejectedValue(new Error('invalid code'));

      await expect(
        controller.createJsapiPayment(request, { code: 'BAD', outTradeNo: 'ORD1', description: '订单 ORD1' }),
      ).rejects.toThrow('invalid code');
      expect(wechatPayService.createJsapiPayment).not.toHaveBeenCalled();
    });

    it('should not exchange the login code when the order is not payable', async () => {
      ordersService.findPayableOrder.mockRejectedValue(new Error('not payable'));

      await expect(
        controller.createJsapiPayment(request, { code: 'C1', outTradeNo: 'ORD1', description: '订单 ORD1' }),
      ).rejects.toThrow('not payable');
      expect(wechatService.miniAppLogin).not.toHaveBeenCalled();
    });
  });
});

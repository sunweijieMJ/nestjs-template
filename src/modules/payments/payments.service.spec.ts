import { UnprocessableEntityException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { OrdersService } from '../orders/orders.service';
import { Order, OrderStatus, PaymentChannel } from '../orders/domain/order';
import { PaymentGatewayRegistry } from './gateways/payment-gateway.registry';
import { PaymentGateway } from './gateways/payment-gateway';

function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 1,
    userId: 10,
    orderNo: 'ORD1',
    status: OrderStatus.PAID,
    paymentChannel: PaymentChannel.ALIPAY,
    transactionId: 'T1',
    totalAmount: 9900,
    paidAmount: 9900,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('PaymentsService', () => {
  let ordersService: jest.Mocked<Pick<OrdersService, 'updatePaymentStatus' | 'findRefundableOrder' | 'markRefunded'>>;
  let gateway: jest.Mocked<PaymentGateway>;
  let service: PaymentsService;

  beforeEach(() => {
    ordersService = {
      updatePaymentStatus: jest.fn(),
      findRefundableOrder: jest.fn(),
      markRefunded: jest.fn(),
    };
    gateway = {
      channel: PaymentChannel.ALIPAY,
      closeTrade: jest.fn(),
      refund: jest.fn(),
    } as unknown as jest.Mocked<PaymentGateway>;
    const registry = { get: jest.fn().mockReturnValue(gateway) } as unknown as PaymentGatewayRegistry;
    service = new PaymentsService(ordersService as unknown as OrdersService, registry);
  });

  describe('confirmPaid', () => {
    const notification = { channel: PaymentChannel.ALIPAY, orderNo: 'ORD1', transactionId: 'T2', paidAmount: 9900 };

    it('should not refund when the notification marks the order as paid', async () => {
      ordersService.updatePaymentStatus.mockResolvedValue({ order: buildOrder(), outcome: 'paid' });

      await service.confirmPaid(notification);

      expect(gateway.refund).not.toHaveBeenCalled();
    });

    it('should not refund a repeated notification of the recorded transaction', async () => {
      ordersService.updatePaymentStatus.mockResolvedValue({ order: buildOrder(), outcome: 'duplicate' });

      await service.confirmPaid(notification);

      expect(gateway.refund).not.toHaveBeenCalled();
    });

    it('should fully refund the extra payment with a fixed refund number on conflict', async () => {
      ordersService.updatePaymentStatus.mockResolvedValue({ order: buildOrder(), outcome: 'conflict' });
      gateway.refund.mockResolvedValue({ succeeded: true, raw: {} });

      await service.confirmPaid(notification);

      expect(gateway.refund).toHaveBeenCalledWith(
        expect.objectContaining({ orderNo: 'ORD1', refundNo: 'ORD1DUP', refundAmount: 9900, totalAmount: 9900 }),
      );
    });

    it('should propagate a refund failure so the channel retries the notification', async () => {
      ordersService.updatePaymentStatus.mockResolvedValue({ order: buildOrder(), outcome: 'conflict' });
      gateway.refund.mockRejectedValue(new Error('network'));

      await expect(service.confirmPaid(notification)).rejects.toThrow('network');
    });
  });

  describe('refund', () => {
    const params = { orderNo: 'ORD1', refundNo: 'R1', refundAmount: 9900 };

    it('should mark the order refunded after a completed full refund', async () => {
      const order = buildOrder();
      ordersService.findRefundableOrder.mockResolvedValue(order);
      gateway.refund.mockResolvedValue({ succeeded: true, raw: {} });

      await service.refund(PaymentChannel.ALIPAY, params);

      expect(gateway.refund).toHaveBeenCalledWith(expect.objectContaining({ refundNo: 'R1', totalAmount: 9900 }));
      expect(ordersService.markRefunded).toHaveBeenCalledWith(order);
    });

    it('should keep the order paid after a partial refund', async () => {
      ordersService.findRefundableOrder.mockResolvedValue(buildOrder());
      gateway.refund.mockResolvedValue({ succeeded: true, raw: {} });

      await service.refund(PaymentChannel.ALIPAY, { ...params, refundAmount: 100 });

      expect(ordersService.markRefunded).not.toHaveBeenCalled();
    });

    it('should keep the order paid while the refund is still processing', async () => {
      ordersService.findRefundableOrder.mockResolvedValue(buildOrder());
      gateway.refund.mockResolvedValue({ succeeded: false, raw: {} });

      await service.refund(PaymentChannel.ALIPAY, params);

      expect(ordersService.markRefunded).not.toHaveBeenCalled();
    });

    it.each([0, 99.5])('should throw 422 without refunding when the amount is %p fen', async (refundAmount) => {
      await expect(service.refund(PaymentChannel.ALIPAY, { ...params, refundAmount })).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
      expect(ordersService.findRefundableOrder).not.toHaveBeenCalled();
      expect(gateway.refund).not.toHaveBeenCalled();
    });

    it('should throw 422 without refunding when the order was paid through another channel', async () => {
      ordersService.findRefundableOrder.mockResolvedValue(buildOrder({ paymentChannel: PaymentChannel.WECHAT }));

      await expect(service.refund(PaymentChannel.ALIPAY, params)).rejects.toBeInstanceOf(UnprocessableEntityException);
      expect(gateway.refund).not.toHaveBeenCalled();
    });
  });
});

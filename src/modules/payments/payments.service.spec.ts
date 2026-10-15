import type { Mocked } from 'vitest';
import { UnprocessableEntityException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { OrdersService } from '../orders/orders.service';
import { Order, OrderStatus, PaymentChannel } from '../orders/domain/order';
import { PaymentGatewayRegistry } from './gateways/payment-gateway.registry';
import { PaymentGateway } from './gateways/payment-gateway';
import { NotificationsService } from '../notifications/notifications.service';

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
    refundedAmount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('PaymentsService', () => {
  let ordersService: Mocked<
    Pick<OrdersService, 'updatePaymentStatus' | 'findRefundableOrder' | 'recordRefund' | 'findByOrderNo'>
  >;
  let gateway: Mocked<PaymentGateway>;
  let notificationsService: Mocked<Pick<NotificationsService, 'notifyPaymentSucceeded'>>;
  let service: PaymentsService;

  beforeEach(() => {
    ordersService = {
      updatePaymentStatus: vi.fn(),
      findRefundableOrder: vi.fn(),
      recordRefund: vi.fn(),
      findByOrderNo: vi.fn(),
    };
    gateway = {
      channel: PaymentChannel.ALIPAY,
      closeTrade: vi.fn(),
      refund: vi.fn(),
    };
    const registry = { get: vi.fn().mockReturnValue(gateway) } as unknown as PaymentGatewayRegistry;
    notificationsService = { notifyPaymentSucceeded: vi.fn() };
    service = new PaymentsService(
      ordersService as unknown as OrdersService,
      registry,
      notificationsService as unknown as NotificationsService,
    );
  });

  describe('confirmPaid', () => {
    const notification = { channel: PaymentChannel.ALIPAY, orderNo: 'ORD1', transactionId: 'T2', paidAmount: 9900 };

    it('should not refund when the notification marks the order as paid', async () => {
      ordersService.updatePaymentStatus.mockResolvedValue({ order: buildOrder(), outcome: 'paid' });

      await service.confirmPaid(notification);

      expect(gateway.refund).not.toHaveBeenCalled();
    });

    it('should notify the user when the notification marks the order as paid', async () => {
      const paidAt = new Date('2026-10-14T07:01:00Z');
      ordersService.updatePaymentStatus.mockResolvedValue({ order: buildOrder({ paidAt }), outcome: 'paid' });

      await service.confirmPaid(notification);

      expect(notificationsService.notifyPaymentSucceeded).toHaveBeenCalledWith({
        userId: 10,
        orderId: 1,
        orderNo: 'ORD1',
        paidAmount: 9900,
        paidAt,
      });
    });

    it('should not notify again for a repeated notification', async () => {
      ordersService.updatePaymentStatus.mockResolvedValue({ order: buildOrder(), outcome: 'duplicate' });

      await service.confirmPaid(notification);

      expect(notificationsService.notifyPaymentSucceeded).not.toHaveBeenCalled();
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

  describe('confirmRefunded', () => {
    const notification = {
      channel: PaymentChannel.ALIPAY,
      orderNo: 'ORD1',
      transactionId: 'T1',
      refundNo: 'R1',
      refundAmount: 100,
    };

    it('should record the refund of the order transaction', async () => {
      const order = buildOrder();
      ordersService.findByOrderNo.mockResolvedValue(order);

      await service.confirmRefunded(notification);

      expect(ordersService.recordRefund).toHaveBeenCalledWith(order, 'R1', 100);
    });

    it('should not record a refund of another transaction of the order', async () => {
      ordersService.findByOrderNo.mockResolvedValue(buildOrder());

      await service.confirmRefunded({ ...notification, transactionId: 'T2' });

      expect(ordersService.recordRefund).not.toHaveBeenCalled();
    });

    it('should not record a refund when the order is not paid', async () => {
      ordersService.findByOrderNo.mockResolvedValue(buildOrder({ status: OrderStatus.REFUNDED }));

      await service.confirmRefunded(notification);

      expect(ordersService.recordRefund).not.toHaveBeenCalled();
    });
  });

  describe('refund', () => {
    const params = { orderNo: 'ORD1', refundNo: 'R1', refundAmount: 9900 };

    it('should record a completed refund on the order', async () => {
      const order = buildOrder();
      ordersService.findRefundableOrder.mockResolvedValue(order);
      gateway.refund.mockResolvedValue({ succeeded: true, raw: {} });

      await service.refund(PaymentChannel.ALIPAY, { ...params, refundAmount: 100 });

      expect(gateway.refund).toHaveBeenCalledWith(expect.objectContaining({ refundNo: 'R1', totalAmount: 9900 }));
      expect(ordersService.recordRefund).toHaveBeenCalledWith(order, 'R1', 100);
    });

    it('should not record the refund while it is still processing', async () => {
      ordersService.findRefundableOrder.mockResolvedValue(buildOrder());
      gateway.refund.mockResolvedValue({ succeeded: false, raw: {} });

      await service.refund(PaymentChannel.ALIPAY, params);

      expect(ordersService.recordRefund).not.toHaveBeenCalled();
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

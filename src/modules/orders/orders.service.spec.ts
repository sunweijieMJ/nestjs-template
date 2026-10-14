import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderRepository } from './infrastructure/persistence/order.repository';
import { Order, OrderStatus, PaymentChannel, ORDER_PAYMENT_TIMEOUT_MS } from './domain/order';
import { ProductCatalog } from './infrastructure/catalog/product-catalog';
import { PaymentTradeCloser } from './payment-trade-closer';

function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 1,
    userId: 10,
    orderNo: 'ORD1',
    status: OrderStatus.UNPAID,
    totalAmount: 9900,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('OrdersService', () => {
  let orderRepository: jest.Mocked<
    Pick<
      OrderRepository,
      | 'findByOrderNo'
      | 'findByIdAndUserId'
      | 'updatePaymentStatus'
      | 'update'
      | 'closeIfUnpaid'
      | 'closeExpiredUnpaid'
      | 'createWithItems'
    >
  >;
  let productCatalog: jest.Mocked<ProductCatalog>;
  let paymentTradeCloser: jest.Mocked<PaymentTradeCloser>;
  let service: OrdersService;

  beforeEach(() => {
    orderRepository = {
      findByOrderNo: jest.fn(),
      findByIdAndUserId: jest.fn(),
      updatePaymentStatus: jest.fn(),
      update: jest.fn(),
      closeIfUnpaid: jest.fn(),
      closeExpiredUnpaid: jest.fn(),
      createWithItems: jest.fn(),
    };
    productCatalog = { findByIds: jest.fn() };
    paymentTradeCloser = { closeTrades: jest.fn() };
    service = new OrdersService(orderRepository as unknown as OrderRepository, productCatalog, paymentTradeCloser);
  });

  describe('create', () => {
    it('should write the order and its items together with the computed total', async () => {
      const created = { ...buildOrder({ totalAmount: 250 }), items: [] };
      orderRepository.createWithItems.mockResolvedValue(created);
      productCatalog.findByIds.mockResolvedValue([
        { id: 'P1', name: 'A', unitPrice: 100 },
        { id: 'P2', name: 'B', unitPrice: 50 },
      ]);

      const result = await service.create(10, {
        items: [
          { productId: 'P1', quantity: 2 },
          { productId: 'P2', quantity: 1 },
        ],
      });

      expect(result).toBe(created);
      expect(productCatalog.findByIds).toHaveBeenCalledWith(['P1', 'P2']);
      const [orderData] = orderRepository.createWithItems.mock.calls[0];
      expect(orderData.expiresAt!.getTime() - Date.now()).toBeGreaterThan(ORDER_PAYMENT_TIMEOUT_MS - 5000);
      expect(orderRepository.createWithItems).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 10, status: OrderStatus.UNPAID, totalAmount: 250 }),
        [
          expect.objectContaining({ productId: 'P1', productName: 'A', unitPrice: 100, subtotal: 200 }),
          expect.objectContaining({ productId: 'P2', productName: 'B', unitPrice: 50, subtotal: 50 }),
        ],
      );
    });

    it('should price repeated items from the catalog and query each product once', async () => {
      orderRepository.createWithItems.mockResolvedValue({ ...buildOrder(), items: [] });
      productCatalog.findByIds.mockResolvedValue([{ id: 'P1', name: 'A', unitPrice: 100 }]);

      await service.create(10, {
        items: [
          { productId: 'P1', quantity: 1 },
          { productId: 'P1', quantity: 3 },
        ],
      });

      expect(productCatalog.findByIds).toHaveBeenCalledWith(['P1']);
      expect(orderRepository.createWithItems).toHaveBeenCalledWith(
        expect.objectContaining({ totalAmount: 400 }),
        expect.any(Array),
      );
    });

    it('should treat a product with a non-positive or fractional price as unavailable', async () => {
      productCatalog.findByIds.mockResolvedValue([
        { id: 'P1', name: 'A', unitPrice: 0 },
        { id: 'P2', name: 'B', unitPrice: 99.5 },
      ]);

      await expect(service.create(10, { items: [{ productId: 'P1', quantity: 1 }] })).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
      await expect(service.create(10, { items: [{ productId: 'P2', quantity: 1 }] })).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
      expect(orderRepository.createWithItems).not.toHaveBeenCalled();
    });

    it('should throw 422 without writing when the total exceeds the amount limit', async () => {
      productCatalog.findByIds.mockResolvedValue([{ id: 'P1', name: 'A', unitPrice: 9900 }]);

      await expect(service.create(10, { items: [{ productId: 'P1', quantity: 300000 }] })).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
      expect(orderRepository.createWithItems).not.toHaveBeenCalled();
    });

    it('should retry with a new order number when the generated one already exists', async () => {
      productCatalog.findByIds.mockResolvedValue([{ id: 'P1', name: 'A', unitPrice: 100 }]);
      const collision = Object.assign(new Error('duplicate'), { code: '23505', constraint: 'UQ_order_orderNo' });
      orderRepository.createWithItems
        .mockRejectedValueOnce(collision)
        .mockResolvedValueOnce({ ...buildOrder(), items: [] });

      await service.create(10, { items: [{ productId: 'P1', quantity: 1 }] });

      const [first, second] = orderRepository.createWithItems.mock.calls.map(([data]) => data.orderNo);
      expect(second).not.toBe(first);
    });

    it('should not retry other unique violations', async () => {
      productCatalog.findByIds.mockResolvedValue([{ id: 'P1', name: 'A', unitPrice: 100 }]);
      const other = Object.assign(new Error('duplicate'), { code: '23505', constraint: 'PK_order_id' });
      orderRepository.createWithItems.mockRejectedValue(other);

      await expect(service.create(10, { items: [{ productId: 'P1', quantity: 1 }] })).rejects.toBe(other);
      expect(orderRepository.createWithItems).toHaveBeenCalledTimes(1);
    });

    it('should throw 422 without writing when a product is not in the catalog', async () => {
      productCatalog.findByIds.mockResolvedValue([{ id: 'P1', name: 'A', unitPrice: 100 }]);

      await expect(
        service.create(10, {
          items: [
            { productId: 'P1', quantity: 1 },
            { productId: 'P2', quantity: 1 },
          ],
        }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
      expect(orderRepository.createWithItems).not.toHaveBeenCalled();
    });
  });

  describe('findOwnedByOrderNo', () => {
    it('should return the order owned by the user', async () => {
      orderRepository.findByOrderNo.mockResolvedValue(buildOrder());
      await expect(service.findOwnedByOrderNo('ORD1', '10')).resolves.toMatchObject({ orderNo: 'ORD1' });
    });

    it('should throw 404 when the order belongs to another user', async () => {
      orderRepository.findByOrderNo.mockResolvedValue(buildOrder({ userId: 11 }));
      await expect(service.findOwnedByOrderNo('ORD1', 10)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw 404 when the order does not exist', async () => {
      orderRepository.findByOrderNo.mockResolvedValue(null);
      await expect(service.findOwnedByOrderNo('ORD1', 10)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findPayableOrder', () => {
    it('should return the unpaid order before the payment deadline', async () => {
      orderRepository.findByOrderNo.mockResolvedValue(buildOrder({ expiresAt: new Date(Date.now() + 60_000) }));
      await expect(service.findPayableOrder('ORD1', 10)).resolves.toMatchObject({ orderNo: 'ORD1' });
    });

    it('should throw 422 when the order is not unpaid', async () => {
      orderRepository.findByOrderNo.mockResolvedValue(buildOrder({ status: OrderStatus.PAID }));
      await expect(service.findPayableOrder('ORD1', 10)).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('should throw 422 when the payment deadline has passed', async () => {
      orderRepository.findByOrderNo.mockResolvedValue(buildOrder({ expiresAt: new Date(Date.now() - 1000) }));
      await expect(service.findPayableOrder('ORD1', 10)).rejects.toBeInstanceOf(UnprocessableEntityException);
    });
  });

  describe('findRefundableOrder', () => {
    it('should return the order when it is paid and the refund does not exceed the paid amount', async () => {
      orderRepository.findByOrderNo.mockResolvedValue(buildOrder({ status: OrderStatus.PAID, paidAmount: 9900 }));
      await expect(service.findRefundableOrder('ORD1', 9900)).resolves.toMatchObject({ orderNo: 'ORD1' });
    });

    it('should throw 422 when the refund exceeds the paid amount', async () => {
      orderRepository.findByOrderNo.mockResolvedValue(buildOrder({ status: OrderStatus.PAID, paidAmount: 9900 }));
      await expect(service.findRefundableOrder('ORD1', 9901)).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('should throw 422 when the order is unpaid', async () => {
      orderRepository.findByOrderNo.mockResolvedValue(buildOrder());
      await expect(service.findRefundableOrder('ORD1', 100)).rejects.toBeInstanceOf(UnprocessableEntityException);
    });
  });

  describe('updatePaymentStatus', () => {
    const paymentData = { paymentChannel: PaymentChannel.ALIPAY, transactionId: 'T1', paidAmount: 9900 };

    it('should report paid when this notification marks the order as paid', async () => {
      orderRepository.findByOrderNo.mockResolvedValue(buildOrder());
      orderRepository.updatePaymentStatus.mockResolvedValue({
        updated: true,
        order: buildOrder({ status: OrderStatus.PAID }),
      });

      await expect(service.updatePaymentStatus('ORD1', OrderStatus.PAID, paymentData)).resolves.toMatchObject({
        outcome: 'paid',
        order: { status: OrderStatus.PAID },
      });
    });

    it('should report duplicate when the same transaction was already recorded', async () => {
      const paid = buildOrder({ status: OrderStatus.PAID, paymentChannel: PaymentChannel.ALIPAY, transactionId: 'T1' });
      orderRepository.findByOrderNo.mockResolvedValue(paid);
      orderRepository.updatePaymentStatus.mockResolvedValue({ updated: false, order: paid });

      await expect(service.updatePaymentStatus('ORD1', OrderStatus.PAID, paymentData)).resolves.toMatchObject({
        outcome: 'duplicate',
      });
    });

    it('should report conflict when the order was paid by another transaction', async () => {
      const paid = buildOrder({ status: OrderStatus.PAID, paymentChannel: PaymentChannel.WECHAT, transactionId: 'W1' });
      orderRepository.findByOrderNo.mockResolvedValue(paid);
      orderRepository.updatePaymentStatus.mockResolvedValue({ updated: false, order: paid });

      await expect(service.updatePaymentStatus('ORD1', OrderStatus.PAID, paymentData)).resolves.toMatchObject({
        outcome: 'conflict',
      });
    });

    it('should throw 422 without updating when the paid amount mismatches', async () => {
      orderRepository.findByOrderNo.mockResolvedValue(buildOrder());

      await expect(
        service.updatePaymentStatus('ORD1', OrderStatus.PAID, { ...paymentData, paidAmount: 1 }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
      expect(orderRepository.updatePaymentStatus).not.toHaveBeenCalled();
    });
  });

  describe('cancelOrder', () => {
    it('should close the unpaid order', async () => {
      orderRepository.findByIdAndUserId.mockResolvedValue(buildOrder());
      orderRepository.closeIfUnpaid.mockResolvedValue(true);

      await expect(service.cancelOrder(1, 10)).resolves.toBeUndefined();
      expect(orderRepository.closeIfUnpaid).toHaveBeenCalledWith(1, 10);
      expect(paymentTradeCloser.closeTrades).toHaveBeenCalledWith('ORD1');
    });

    it('should not wait for the channels to close their trades', async () => {
      orderRepository.findByIdAndUserId.mockResolvedValue(buildOrder());
      orderRepository.closeIfUnpaid.mockResolvedValue(true);
      paymentTradeCloser.closeTrades.mockReturnValue(new Promise(() => undefined));

      await expect(service.cancelOrder(1, 10)).resolves.toBeUndefined();
    });

    it('should throw 422 when the order is paid before the close is applied', async () => {
      orderRepository.findByIdAndUserId.mockResolvedValue(buildOrder());
      orderRepository.closeIfUnpaid.mockResolvedValue(false);

      await expect(service.cancelOrder(1, 10)).rejects.toBeInstanceOf(UnprocessableEntityException);
      expect(paymentTradeCloser.closeTrades).not.toHaveBeenCalled();
    });
  });

  describe('closeExpiredOrders', () => {
    it('should close unpaid orders whose payment deadline has passed', async () => {
      orderRepository.closeExpiredUnpaid.mockResolvedValue(2);
      const before = Date.now();

      await expect(service.closeExpiredOrders()).resolves.toBe(2);

      expect(orderRepository.closeExpiredUnpaid.mock.calls[0][0].getTime()).toBeGreaterThanOrEqual(before);
    });
  });
});

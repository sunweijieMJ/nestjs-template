import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderRepository } from './infrastructure/persistence/order.repository';
import { Order, OrderStatus, PaymentChannel } from './domain/order';

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
      'findByOrderNo' | 'findByIdAndUserId' | 'updatePaymentStatus' | 'update' | 'closeIfUnpaid' | 'createWithItems'
    >
  >;
  let service: OrdersService;

  beforeEach(() => {
    orderRepository = {
      findByOrderNo: jest.fn(),
      findByIdAndUserId: jest.fn(),
      updatePaymentStatus: jest.fn(),
      update: jest.fn(),
      closeIfUnpaid: jest.fn(),
      createWithItems: jest.fn(),
    };
    service = new OrdersService(orderRepository as unknown as OrderRepository);
  });

  describe('create', () => {
    it('should write the order and its items together with the computed total', async () => {
      const created = { ...buildOrder({ totalAmount: 250 }), items: [] };
      orderRepository.createWithItems.mockResolvedValue(created);

      const result = await service.create(10, {
        items: [
          { productId: 'P1', productName: 'A', unitPrice: 100, quantity: 2 },
          { productId: 'P2', productName: 'B', unitPrice: 50, quantity: 1 },
        ],
      });

      expect(result).toBe(created);
      expect(orderRepository.createWithItems).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 10, status: OrderStatus.UNPAID, totalAmount: 250 }),
        [
          expect.objectContaining({ productId: 'P1', subtotal: 200 }),
          expect.objectContaining({ productId: 'P2', subtotal: 50 }),
        ],
      );
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
    it('should throw 422 when the order is not unpaid', async () => {
      orderRepository.findByOrderNo.mockResolvedValue(buildOrder({ status: OrderStatus.PAID }));
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

    it('should mark the order as paid when the paid amount matches', async () => {
      orderRepository.findByOrderNo.mockResolvedValue(buildOrder());
      orderRepository.updatePaymentStatus.mockResolvedValue(buildOrder({ status: OrderStatus.PAID }));

      await expect(service.updatePaymentStatus('ORD1', OrderStatus.PAID, paymentData)).resolves.toMatchObject({
        status: OrderStatus.PAID,
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
    });

    it('should throw 422 when the order is paid before the close is applied', async () => {
      orderRepository.findByIdAndUserId.mockResolvedValue(buildOrder());
      orderRepository.closeIfUnpaid.mockResolvedValue(false);

      await expect(service.cancelOrder(1, 10)).rejects.toBeInstanceOf(UnprocessableEntityException);
    });
  });
});

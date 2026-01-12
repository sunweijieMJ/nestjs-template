import { Order, OrderStatus, PaymentChannel } from '../../../../domain/order';
import { OrderEntity } from '../entities/order.entity';

export class OrderMapper {
  static toDomain(raw: OrderEntity): Order {
    const domainEntity = new Order();
    domainEntity.id = raw.id;
    domainEntity.userId = raw.userId;
    domainEntity.orderNo = raw.orderNo;
    domainEntity.status = raw.status as OrderStatus;
    domainEntity.paymentChannel = raw.paymentChannel ? (raw.paymentChannel as PaymentChannel) : undefined;
    domainEntity.transactionId = raw.transactionId ?? undefined;
    domainEntity.totalAmount = raw.totalAmount;
    domainEntity.paidAmount = raw.paidAmount ?? undefined;
    domainEntity.paidAt = raw.paidAt ?? undefined;
    domainEntity.refundedAt = raw.refundedAt ?? undefined;
    domainEntity.closedAt = raw.closedAt ?? undefined;
    domainEntity.metadata = raw.metadata ?? undefined;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt ?? undefined;
    return domainEntity;
  }

  static toPersistence(domainEntity: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): OrderEntity {
    const persistenceEntity = new OrderEntity();
    persistenceEntity.userId = Number(domainEntity.userId);
    persistenceEntity.orderNo = domainEntity.orderNo;
    persistenceEntity.status = domainEntity.status;
    persistenceEntity.paymentChannel = domainEntity.paymentChannel ?? null;
    persistenceEntity.transactionId = domainEntity.transactionId ?? null;
    persistenceEntity.totalAmount = domainEntity.totalAmount;
    persistenceEntity.paidAmount = domainEntity.paidAmount ?? null;
    persistenceEntity.paidAt = domainEntity.paidAt ?? null;
    persistenceEntity.refundedAt = domainEntity.refundedAt ?? null;
    persistenceEntity.closedAt = domainEntity.closedAt ?? null;
    persistenceEntity.metadata = domainEntity.metadata ?? null;
    return persistenceEntity;
  }
}

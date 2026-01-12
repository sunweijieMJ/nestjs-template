import { OrderItem } from '../../../../domain/order-item';
import { OrderItemEntity } from '../entities/order-item.entity';

export class OrderItemMapper {
  static toDomain(raw: OrderItemEntity): OrderItem {
    const domainEntity = new OrderItem();
    domainEntity.id = raw.id;
    domainEntity.orderId = raw.orderId;
    domainEntity.productId = raw.productId;
    domainEntity.productName = raw.productName;
    domainEntity.productImage = raw.productImage ?? undefined;
    domainEntity.unitPrice = raw.unitPrice;
    domainEntity.quantity = raw.quantity;
    domainEntity.subtotal = raw.subtotal;
    domainEntity.metadata = raw.metadata ?? undefined;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    return domainEntity;
  }

  static toPersistence(domainEntity: Omit<OrderItem, 'id' | 'createdAt' | 'updatedAt'>): OrderItemEntity {
    const persistenceEntity = new OrderItemEntity();
    persistenceEntity.orderId = Number(domainEntity.orderId);
    persistenceEntity.productId = domainEntity.productId;
    persistenceEntity.productName = domainEntity.productName;
    persistenceEntity.productImage = domainEntity.productImage ?? null;
    persistenceEntity.unitPrice = domainEntity.unitPrice;
    persistenceEntity.quantity = domainEntity.quantity;
    persistenceEntity.subtotal = domainEntity.subtotal;
    persistenceEntity.metadata = domainEntity.metadata ?? null;
    return persistenceEntity;
  }
}

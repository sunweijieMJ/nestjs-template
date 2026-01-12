import { NullableType } from '../../../../common/types/nullable.type';
import { OrderItem } from '../../domain/order-item';

export abstract class OrderItemRepository {
  abstract create(data: Omit<OrderItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<OrderItem>;

  abstract createMany(data: Omit<OrderItem, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<OrderItem[]>;

  abstract findByOrderId(orderId: OrderItem['orderId']): Promise<OrderItem[]>;

  abstract findById(id: OrderItem['id']): Promise<NullableType<OrderItem>>;

  abstract removeByOrderId(orderId: OrderItem['orderId']): Promise<void>;
}

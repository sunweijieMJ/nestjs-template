import { DeepPartial } from '../../../../common/types/deep-partial.type';
import { NullableType } from '../../../../common/types/nullable.type';
import { IPaginationOptions } from '../../../../common/types/pagination-options';
import { Order, OrderStatus, PaymentChannel } from '../../domain/order';
import { QueryOrderDto } from '../../dto/query-order.dto';

export abstract class OrderRepository {
  abstract create(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Order>;

  abstract findManyWithPagination({
    userId,
    filterOptions,
    paginationOptions,
  }: {
    userId: Order['userId'];
    filterOptions?: QueryOrderDto | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Order[]>;

  abstract findById(id: Order['id']): Promise<NullableType<Order>>;

  abstract findByOrderNo(orderNo: string): Promise<NullableType<Order>>;

  abstract findByIdAndUserId(id: Order['id'], userId: Order['userId']): Promise<NullableType<Order>>;

  abstract update(id: Order['id'], payload: DeepPartial<Order>): Promise<Order | null>;

  abstract updatePaymentStatus(
    orderNo: string,
    status: OrderStatus,
    paymentData: {
      paymentChannel: PaymentChannel;
      transactionId: string;
      paidAmount: number;
      paidAt: Date;
    },
  ): Promise<Order | null>;

  abstract countByUserId(userId: Order['userId'], filterOptions?: QueryOrderDto | null): Promise<number>;

  abstract remove(id: Order['id']): Promise<void>;
}

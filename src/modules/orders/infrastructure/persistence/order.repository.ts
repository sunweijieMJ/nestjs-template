import { DeepPartial } from '../../../../common/types/deep-partial.type';
import { NullableType } from '../../../../common/types/nullable.type';
import { IPaginationOptions } from '../../../../common/types/pagination-options';
import { Order, OrderStatus, PaymentChannel } from '../../domain/order';
import { OrderItem } from '../../domain/order-item';
import { QueryOrderDto } from '../../dto/query-order.dto';

export abstract class OrderRepository {
  abstract create(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Order>;

  abstract createWithItems(
    data: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
    items: Omit<OrderItem, 'id' | 'orderId' | 'createdAt' | 'updatedAt'>[],
  ): Promise<Order & { items: OrderItem[] }>;

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

  abstract findByIdAndUserIdWithItems(
    id: Order['id'],
    userId: Order['userId'],
  ): Promise<NullableType<Order & { items: OrderItem[] }>>;

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
  ): Promise<{ updated: boolean; order: NullableType<Order> }>;

  /** 已支付订单累加一笔退款，累计金额达到实付金额时置为已退款；同一退款单号只累加一次，返回是否累加 */
  abstract recordRefund(orderNo: string, refundNo: string, refundAmount: number): Promise<boolean>;

  abstract closeIfUnpaid(id: Order['id'], userId: Order['userId']): Promise<boolean>;

  /** 关闭支付截止时间早于 now 的待支付订单，返回关闭数量 */
  abstract closeExpiredUnpaid(now: Date): Promise<number>;

  abstract countByUserId(userId: Order['userId'], filterOptions?: QueryOrderDto | null): Promise<number>;

  abstract remove(id: Order['id']): Promise<void>;
}

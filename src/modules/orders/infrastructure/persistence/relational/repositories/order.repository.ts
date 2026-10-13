import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In, IsNull } from 'typeorm';
import { OrderEntity } from '../entities/order.entity';
import { OrderItemEntity } from '../entities/order-item.entity';
import { OrderMapper } from '../mappers/order.mapper';
import { OrderItemMapper } from '../mappers/order-item.mapper';
import { Order, OrderStatus, PaymentChannel } from '../../../../domain/order';
import { OrderItem } from '../../../../domain/order-item';
import { OrderRepository } from '../../order.repository';
import { NullableType } from '../../../../../../common/types/nullable.type';
import { IPaginationOptions } from '../../../../../../common/types/pagination-options';
import { QueryOrderDto } from '../../../../dto/query-order.dto';
import { DeepPartial } from '../../../../../../common/types/deep-partial.type';

@Injectable()
export class OrderRelationalRepository implements OrderRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
  ) {}

  async create(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Order> {
    const persistenceModel = OrderMapper.toPersistence(data);
    const newEntity = await this.orderRepository.save(this.orderRepository.create(persistenceModel));
    return OrderMapper.toDomain(newEntity);
  }

  async createWithItems(
    data: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
    items: Omit<OrderItem, 'id' | 'orderId' | 'createdAt' | 'updatedAt'>[],
  ): Promise<Order & { items: OrderItem[] }> {
    return this.orderRepository.manager.transaction(async (manager) => {
      const orderEntity = await manager.save(manager.create(OrderEntity, OrderMapper.toPersistence(data)));
      const itemEntities = await manager.save(
        items.map((item) =>
          manager.create(OrderItemEntity, OrderItemMapper.toPersistence({ ...item, orderId: orderEntity.id })),
        ),
      );

      return {
        ...OrderMapper.toDomain(orderEntity),
        items: itemEntities.map((entity) => OrderItemMapper.toDomain(entity)),
      };
    });
  }

  async findManyWithPagination({
    userId,
    filterOptions,
    paginationOptions,
  }: {
    userId: Order['userId'];
    filterOptions?: QueryOrderDto | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Order[]> {
    const where: FindOptionsWhere<OrderEntity> = {
      userId: Number(userId),
    };

    if (filterOptions?.status) {
      where.status = filterOptions.status;
    }

    if (filterOptions?.paymentChannel) {
      where.paymentChannel = filterOptions.paymentChannel;
    }

    const page = paginationOptions.page ?? 1;
    const limit = paginationOptions.limit ?? 10;
    const skip = (page - 1) * limit;

    const entities = await this.orderRepository.find({
      skip,
      take: limit,
      where,
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => OrderMapper.toDomain(entity));
  }

  async findById(id: Order['id']): Promise<NullableType<Order>> {
    const entity = await this.orderRepository.findOne({
      where: { id: Number(id) },
    });
    return entity ? OrderMapper.toDomain(entity) : null;
  }

  async findByOrderNo(orderNo: string): Promise<NullableType<Order>> {
    const entity = await this.orderRepository.findOne({
      where: { orderNo },
    });
    return entity ? OrderMapper.toDomain(entity) : null;
  }

  async findByIdAndUserId(id: Order['id'], userId: Order['userId']): Promise<NullableType<Order>> {
    const entity = await this.orderRepository.findOne({
      where: { id: Number(id), userId: Number(userId) },
    });
    return entity ? OrderMapper.toDomain(entity) : null;
  }

  async findByIdAndUserIdWithItems(
    id: Order['id'],
    userId: Order['userId'],
  ): Promise<NullableType<Order & { items: import('../../../../domain/order-item').OrderItem[] }>> {
    // 使用 relations 一次性 JOIN 加载 items，避免 N+1 查询
    const entity = await this.orderRepository.findOne({
      where: { id: Number(id), userId: Number(userId) },
      relations: ['items'],
    });

    if (!entity) {
      return null;
    }

    const order = OrderMapper.toDomain(entity);
    const items = (entity.items ?? []).map((item) => OrderItemMapper.toDomain(item));
    return { ...order, items };
  }

  async update(id: Order['id'], payload: DeepPartial<Order>): Promise<Order | null> {
    const entity = await this.orderRepository.findOne({
      where: { id: Number(id) },
    });

    if (!entity) {
      return null;
    }

    const updatedEntity = await this.orderRepository.save(
      this.orderRepository.merge(entity, {
        status: payload.status,
        paymentChannel: payload.paymentChannel ?? entity.paymentChannel,
        transactionId: payload.transactionId ?? entity.transactionId,
        paidAmount: payload.paidAmount ?? entity.paidAmount,
        paidAt: payload.paidAt ?? entity.paidAt,
        refundedAt: payload.refundedAt ?? entity.refundedAt,
        closedAt: payload.closedAt ?? entity.closedAt,
        metadata: payload.metadata ?? entity.metadata,
      }),
    );

    return OrderMapper.toDomain(updatedEntity);
  }

  /**
   * 待支付或已关闭的订单原子更新为支付结果，其余状态保持不变
   */
  async updatePaymentStatus(
    orderNo: string,
    status: OrderStatus,
    paymentData: {
      paymentChannel: PaymentChannel;
      transactionId: string;
      paidAmount: number;
      paidAt: Date;
    },
  ): Promise<Order | null> {
    await this.orderRepository.update(
      { orderNo, status: In([OrderStatus.UNPAID, OrderStatus.CLOSED]), deletedAt: IsNull() },
      {
        status,
        paymentChannel: paymentData.paymentChannel,
        transactionId: paymentData.transactionId,
        paidAmount: paymentData.paidAmount,
        paidAt: paymentData.paidAt,
        closedAt: null,
      },
    );

    const entity = await this.orderRepository.findOne({
      where: { orderNo },
    });

    return entity ? OrderMapper.toDomain(entity) : null;
  }

  async closeIfUnpaid(id: Order['id'], userId: Order['userId']): Promise<boolean> {
    const result = await this.orderRepository.update(
      { id: Number(id), userId: Number(userId), status: OrderStatus.UNPAID, deletedAt: IsNull() },
      { status: OrderStatus.CLOSED, closedAt: new Date() },
    );

    return (result.affected ?? 0) > 0;
  }

  async countByUserId(userId: Order['userId'], filterOptions?: QueryOrderDto | null): Promise<number> {
    const where: FindOptionsWhere<OrderEntity> = {
      userId: Number(userId),
    };

    if (filterOptions?.status) {
      where.status = filterOptions.status;
    }

    if (filterOptions?.paymentChannel) {
      where.paymentChannel = filterOptions.paymentChannel;
    }

    return this.orderRepository.count({ where });
  }

  async remove(id: Order['id']): Promise<void> {
    await this.orderRepository.softDelete({ id: Number(id) });
  }
}

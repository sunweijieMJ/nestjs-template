import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { OrderEntity } from '../entities/order.entity';
import { OrderMapper } from '../mappers/order.mapper';
import { Order, OrderStatus, PaymentChannel } from '../../../../domain/order';
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
    const entity = await this.orderRepository.findOne({
      where: { orderNo },
    });

    if (!entity) {
      return null;
    }

    // Only update if status is UNPAID
    if (entity.status !== OrderStatus.UNPAID) {
      return OrderMapper.toDomain(entity);
    }

    const updatedEntity = await this.orderRepository.save(
      this.orderRepository.merge(entity, {
        status,
        paymentChannel: paymentData.paymentChannel,
        transactionId: paymentData.transactionId,
        paidAmount: paymentData.paidAmount,
        paidAt: paymentData.paidAt,
      }),
    );

    return OrderMapper.toDomain(updatedEntity);
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

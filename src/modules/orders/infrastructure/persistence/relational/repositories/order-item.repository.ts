import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItemEntity } from '../entities/order-item.entity';
import { OrderItemMapper } from '../mappers/order-item.mapper';
import { OrderItem } from '../../../../domain/order-item';
import { OrderItemRepository } from '../../order-item.repository';
import { NullableType } from '../../../../../../common/types/nullable.type';

@Injectable()
export class OrderItemRelationalRepository implements OrderItemRepository {
  constructor(
    @InjectRepository(OrderItemEntity)
    private readonly orderItemRepository: Repository<OrderItemEntity>,
  ) {}

  async create(data: Omit<OrderItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<OrderItem> {
    const persistenceModel = OrderItemMapper.toPersistence(data);
    const newEntity = await this.orderItemRepository.save(this.orderItemRepository.create(persistenceModel));
    return OrderItemMapper.toDomain(newEntity);
  }

  async createMany(data: Omit<OrderItem, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<OrderItem[]> {
    const persistenceModels = data.map((item) => OrderItemMapper.toPersistence(item));
    const entities = await this.orderItemRepository.save(this.orderItemRepository.create(persistenceModels));
    return entities.map((entity) => OrderItemMapper.toDomain(entity));
  }

  async findByOrderId(orderId: OrderItem['orderId']): Promise<OrderItem[]> {
    const entities = await this.orderItemRepository.find({
      where: { orderId: Number(orderId) },
      order: { id: 'ASC' },
    });
    return entities.map((entity) => OrderItemMapper.toDomain(entity));
  }

  async findById(id: OrderItem['id']): Promise<NullableType<OrderItem>> {
    const entity = await this.orderItemRepository.findOne({
      where: { id: Number(id) },
    });
    return entity ? OrderItemMapper.toDomain(entity) : null;
  }

  async removeByOrderId(orderId: OrderItem['orderId']): Promise<void> {
    await this.orderItemRepository.delete({ orderId: Number(orderId) });
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from './entities/order.entity';
import { OrderItemEntity } from './entities/order-item.entity';
import { OrderRepository } from '../order.repository';
import { OrderItemRepository } from '../order-item.repository';
import { OrderRelationalRepository } from './repositories/order.repository';
import { OrderItemRelationalRepository } from './repositories/order-item.repository';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity, OrderItemEntity])],
  providers: [
    {
      provide: OrderRepository,
      useClass: OrderRelationalRepository,
    },
    {
      provide: OrderItemRepository,
      useClass: OrderItemRelationalRepository,
    },
  ],
  exports: [OrderRepository, OrderItemRepository],
})
export class RelationalOrderPersistenceModule {}

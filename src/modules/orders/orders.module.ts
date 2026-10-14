import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { RelationalOrderPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { ProductCatalog } from './infrastructure/catalog/product-catalog';
import { UnavailableProductCatalog } from './infrastructure/catalog/unavailable-product-catalog';
import { PaymentGatewaysModule } from '../payments/gateways/payment-gateways.module';
import { OrderExpiryTask } from './order-expiry.task';

@Module({
  imports: [RelationalOrderPersistenceModule, PaymentGatewaysModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderExpiryTask, { provide: ProductCatalog, useClass: UnavailableProductCatalog }],
  exports: [OrdersService],
})
export class OrdersModule {}

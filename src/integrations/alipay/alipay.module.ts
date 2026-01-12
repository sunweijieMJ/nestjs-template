import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AlipayService } from './alipay.service';
import { AlipayController } from './alipay.controller';
import alipayConfig from './config/alipay.config';
import { OrdersModule } from '../../modules/orders/orders.module';
import databaseConfig from '../../infrastructure/database/config/database.config';
import { DatabaseConfig } from '../../infrastructure/database/config/database-config.type';

const isDocumentDatabase = (databaseConfig() as DatabaseConfig).isDocumentDatabase;

@Module({
  imports: [ConfigModule.forFeature(alipayConfig), ...(isDocumentDatabase ? [] : [forwardRef(() => OrdersModule)])],
  controllers: [AlipayController],
  providers: [AlipayService],
  exports: [AlipayService],
})
export class AlipayModule {}

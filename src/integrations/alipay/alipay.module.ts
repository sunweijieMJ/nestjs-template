import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AlipayService } from './alipay.service';
import { AlipayController } from './alipay.controller';
import alipayConfig from './config/alipay.config';
import { OrdersModule } from '../../modules/orders/orders.module';

@Module({
  imports: [ConfigModule.forFeature(alipayConfig), forwardRef(() => OrdersModule)],
  controllers: [AlipayController],
  providers: [AlipayService],
  exports: [AlipayService],
})
export class AlipayModule {}

import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QqService } from './qq.service';
import { QqPayService } from './qq-pay.service';
import { QqPayController } from './qq-pay.controller';
import qqConfig from './config/qq.config';
import { OrdersModule } from '../../modules/orders/orders.module';

@Module({
  imports: [ConfigModule.forFeature(qqConfig), forwardRef(() => OrdersModule)],
  controllers: [QqPayController],
  providers: [QqService, QqPayService],
  exports: [QqService, QqPayService],
})
export class QqModule {}

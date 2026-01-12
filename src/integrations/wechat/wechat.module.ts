import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WechatService } from './wechat.service';
import { WechatPayService } from './wechat-pay.service';
import { WechatPayController } from './wechat-pay.controller';
import wechatConfig from './config/wechat.config';
import { OrdersModule } from '../../modules/orders/orders.module';

@Module({
  imports: [ConfigModule.forFeature(wechatConfig), forwardRef(() => OrdersModule)],
  controllers: [WechatPayController],
  providers: [WechatService, WechatPayService],
  exports: [WechatService, WechatPayService],
})
export class WechatModule {}

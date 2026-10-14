import { Module } from '@nestjs/common';
import { WechatModule } from '../../integrations/wechat/wechat.module';
import { AlipayModule } from '../../integrations/alipay/alipay.module';
import { OrdersModule } from '../orders/orders.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentGatewaysModule } from './gateways/payment-gateways.module';
import { PaymentsService } from './payments.service';
import { WechatPayController } from './wechat-pay.controller';
import { AlipayController } from './alipay.controller';

@Module({
  imports: [OrdersModule, PaymentGatewaysModule, WechatModule, AlipayModule, NotificationsModule],
  controllers: [WechatPayController, AlipayController],
  providers: [PaymentsService],
})
export class PaymentsModule {}

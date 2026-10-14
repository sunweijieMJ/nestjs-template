import { Module } from '@nestjs/common';
import { WechatModule } from '../../../integrations/wechat/wechat.module';
import { AlipayModule } from '../../../integrations/alipay/alipay.module';
import { PaymentTradeCloser } from '../../orders/payment-trade-closer';
import { WechatPaymentGateway } from './wechat-payment.gateway';
import { AlipayPaymentGateway } from './alipay-payment.gateway';
import { PaymentGatewayRegistry } from './payment-gateway.registry';

@Module({
  imports: [WechatModule, AlipayModule],
  providers: [
    WechatPaymentGateway,
    AlipayPaymentGateway,
    PaymentGatewayRegistry,
    { provide: PaymentTradeCloser, useExisting: PaymentGatewayRegistry },
  ],
  exports: [PaymentGatewayRegistry, PaymentTradeCloser],
})
export class PaymentGatewaysModule {}

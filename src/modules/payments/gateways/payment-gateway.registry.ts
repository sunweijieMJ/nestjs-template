import { Injectable, Logger } from '@nestjs/common';
import { PaymentChannel } from '../../orders/domain/order';
import { PaymentTradeCloser } from '../../orders/payment-trade-closer';
import { PaymentGateway } from './payment-gateway';
import { WechatPaymentGateway } from './wechat-payment.gateway';
import { AlipayPaymentGateway } from './alipay-payment.gateway';

@Injectable()
export class PaymentGatewayRegistry implements PaymentTradeCloser {
  private readonly logger = new Logger(PaymentGatewayRegistry.name);
  private readonly gateways: Map<PaymentChannel, PaymentGateway>;

  constructor(wechat: WechatPaymentGateway, alipay: AlipayPaymentGateway) {
    this.gateways = new Map<PaymentChannel, PaymentGateway>([wechat, alipay].map((g) => [g.channel, g]));
  }

  get(channel: PaymentChannel): PaymentGateway {
    const gateway = this.gateways.get(channel);
    if (!gateway) {
      throw new Error(`Payment gateway not registered: ${channel}`);
    }
    return gateway;
  }

  async closeTrades(orderNo: string): Promise<void> {
    const gateways = [...this.gateways.values()];
    const results = await Promise.allSettled(gateways.map((gateway) => gateway.closeTrade(orderNo)));
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        this.logger.warn(`Failed to close ${gateways[index].channel} trade for order ${orderNo}: ${result.reason}`);
      }
    });
  }
}

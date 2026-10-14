import { Injectable } from '@nestjs/common';
import { AlipayService } from '../../../integrations/alipay/alipay.service';
import { PaymentChannel } from '../../orders/domain/order';
import { fenToYuan } from '../money.utils';
import { GatewayRefundParams, GatewayRefundResult, PaymentGateway } from './payment-gateway';

@Injectable()
export class AlipayPaymentGateway extends PaymentGateway {
  readonly channel = PaymentChannel.ALIPAY;

  constructor(private readonly alipayService: AlipayService) {
    super();
  }

  async closeTrade(orderNo: string): Promise<void> {
    await this.alipayService.closeOrder(orderNo);
  }

  async refund(params: GatewayRefundParams): Promise<GatewayRefundResult> {
    const result = await this.alipayService.refund({
      outTradeNo: params.orderNo,
      outRequestNo: params.refundNo,
      refundAmount: fenToYuan(params.refundAmount),
      refundReason: params.reason,
    });
    return { succeeded: true, raw: result };
  }
}

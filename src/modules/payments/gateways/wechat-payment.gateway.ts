import { Injectable } from '@nestjs/common';
import { WechatPayService } from '../../../integrations/wechat/wechat-pay.service';
import { PaymentChannel } from '../../orders/domain/order';
import { GatewayRefundParams, GatewayRefundResult, PaymentGateway } from './payment-gateway';

@Injectable()
export class WechatPaymentGateway extends PaymentGateway {
  readonly channel = PaymentChannel.WECHAT;

  constructor(private readonly wechatPayService: WechatPayService) {
    super();
  }

  closeTrade(orderNo: string): Promise<void> {
    return this.wechatPayService.closeOrder(orderNo);
  }

  async refund(params: GatewayRefundParams): Promise<GatewayRefundResult> {
    const result = await this.wechatPayService.refund({
      outTradeNo: params.orderNo,
      outRefundNo: params.refundNo,
      refundAmount: params.refundAmount,
      totalAmount: params.totalAmount,
      reason: params.reason,
    });
    return { succeeded: result.status === 'SUCCESS', raw: result };
  }
}

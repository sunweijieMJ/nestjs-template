import { PaymentChannel } from '../../orders/domain/order';

export interface GatewayRefundParams {
  orderNo: string;
  /** 商户退款单号，同一笔退款重试时保持不变 */
  refundNo: string;
  /** 退款金额（分） */
  refundAmount: number;
  /** 渠道交易金额（分） */
  totalAmount: number;
  reason?: string;
}

export interface GatewayRefundResult {
  /** 退款已完成；为 false 时退款仍在渠道处理中 */
  succeeded: boolean;
  raw: Record<string, unknown>;
}

export abstract class PaymentGateway {
  abstract readonly channel: PaymentChannel;

  abstract closeTrade(orderNo: string): Promise<void>;

  abstract refund(params: GatewayRefundParams): Promise<GatewayRefundResult>;
}

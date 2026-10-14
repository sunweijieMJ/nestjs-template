/** 关闭订单在各支付渠道的交易，失败不抛出 */
export abstract class PaymentTradeCloser {
  abstract closeTrades(orderNo: string): Promise<void>;
}

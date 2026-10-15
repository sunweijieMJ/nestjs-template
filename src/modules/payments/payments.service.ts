import { HttpStatus, Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus, PaymentChannel } from '../orders/domain/order';
import { PaymentGatewayRegistry } from './gateways/payment-gateway.registry';
import { GatewayRefundResult } from './gateways/payment-gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly ordersService: OrdersService,
    private readonly gateways: PaymentGatewayRegistry,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * 处理渠道支付成功通知；订单已被另一笔交易支付时，原路全额退回本次支付
   */
  async confirmPaid(params: {
    channel: PaymentChannel;
    orderNo: string;
    transactionId: string;
    /** 实付金额（分） */
    paidAmount: number;
  }): Promise<void> {
    const { order, outcome } = await this.ordersService.updatePaymentStatus(params.orderNo, OrderStatus.PAID, {
      paymentChannel: params.channel,
      transactionId: params.transactionId,
      paidAmount: params.paidAmount,
    });

    // 不等待通知完成，避免拖慢支付回调
    if (outcome === 'paid') {
      void this.notificationsService.notifyPaymentSucceeded({
        userId: Number(order.userId),
        orderId: order.id,
        orderNo: order.orderNo,
        paidAmount: order.paidAmount ?? params.paidAmount,
        paidAt: order.paidAt ?? new Date(),
      });
    }

    if (outcome !== 'conflict') {
      return;
    }

    const refund = await this.gateways.get(params.channel).refund({
      orderNo: params.orderNo,
      refundNo: `${params.orderNo}DUP`,
      refundAmount: params.paidAmount,
      totalAmount: params.paidAmount,
      reason: '重复支付自动退款',
    });
    this.logger.warn(
      `Duplicate ${params.channel} payment ${params.transactionId} for order ${params.orderNo} ` +
        (refund.succeeded ? 'refunded' : 'refund requested, still processing'),
    );
  }

  /**
   * 处理渠道退款成功通知；只记录退回订单当前那笔交易的退款
   */
  async confirmRefunded(params: {
    channel: PaymentChannel;
    orderNo: string;
    transactionId: string;
    refundNo: string;
    /** 本次退款金额（分） */
    refundAmount: number;
  }): Promise<void> {
    const order = await this.ordersService.findByOrderNo(params.orderNo);
    if (
      order?.status !== OrderStatus.PAID ||
      order.paymentChannel !== params.channel ||
      order.transactionId !== params.transactionId
    ) {
      return;
    }

    await this.ordersService.recordRefund(order, params.refundNo, params.refundAmount);
  }

  /**
   * 对已支付订单发起退款，渠道已完成退款时记录到订单
   */
  async refund(
    channel: PaymentChannel,
    params: { orderNo: string; refundNo: string; refundAmount: number; reason?: string },
  ): Promise<GatewayRefundResult> {
    if (!Number.isSafeInteger(params.refundAmount) || params.refundAmount < 1) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          refundAmount: 'invalidRefundAmount',
        },
      });
    }

    const order = await this.ordersService.findRefundableOrder(params.orderNo, params.refundAmount);
    if (order.paymentChannel !== channel) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          order: 'paymentChannelMismatch',
        },
      });
    }

    const paidAmount = order.paidAmount ?? order.totalAmount;
    const result = await this.gateways.get(channel).refund({
      orderNo: order.orderNo,
      refundNo: params.refundNo,
      refundAmount: params.refundAmount,
      totalAmount: paidAmount,
      reason: params.reason,
    });

    if (result.succeeded) {
      await this.ordersService.recordRefund(order, params.refundNo, params.refundAmount);
    }
    return result;
  }
}

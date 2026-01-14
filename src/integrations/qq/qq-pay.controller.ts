import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus, Logger, Optional } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QqPayService } from './qq-pay.service';
import { CreateQqAppPaymentDto } from './dto/create-app-payment.dto';
import { CreateQqH5PaymentDto } from './dto/create-h5-payment.dto';
import { QqRefundDto } from './dto/qq-refund.dto';
import { OrdersService } from '../../modules/orders/orders.service';
import { OrderStatus, PaymentChannel } from '../../modules/orders/domain/order';

@ApiTags('QQ Pay')
@Controller({
  path: 'qq',
  version: '1',
})
export class QqPayController {
  private readonly logger = new Logger(QqPayController.name);

  constructor(
    private readonly qqPayService: QqPayService,
    @Optional() private readonly ordersService?: OrdersService,
  ) {}

  @Post('payment/app')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '创建 APP 支付订单' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '返回支付参数',
  })
  async createAppPayment(@Body() dto: CreateQqAppPaymentDto): Promise<{
    appId: string;
    bargainorId: string;
    tokenId: string;
    nonce: string;
    timestamp: string;
    sig: string;
  }> {
    return this.qqPayService.createAppPayment(dto);
  }

  @Post('payment/h5')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '创建 H5 支付订单' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '返回支付URL',
  })
  async createH5Payment(@Body() dto: CreateQqH5PaymentDto): Promise<{
    payUrl: string;
  }> {
    return this.qqPayService.createH5Payment(dto);
  }

  @Get('order/:outTradeNo')
  @ApiOperation({ summary: '查询订单状态' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '返回订单信息',
  })
  async queryOrder(@Param('outTradeNo') outTradeNo: string): Promise<{
    retcode: string;
    retmsg: string;
    trade_state?: string;
    transaction_id?: string;
    out_trade_no?: string;
    total_fee?: number;
  }> {
    return this.qqPayService.queryOrder(outTradeNo);
  }

  @Post('refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '申请退款' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '返回退款结果',
  })
  async refund(@Body() dto: QqRefundDto): Promise<{
    refundId: string;
    outRefundNo: string;
    outTradeNo: string;
  }> {
    return this.qqPayService.refund(dto);
  }

  @Post('close/:outTradeNo')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '关闭订单' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '订单关闭成功',
  })
  async closeOrder(@Param('outTradeNo') outTradeNo: string): Promise<void> {
    return this.qqPayService.closeOrder(outTradeNo);
  }

  @Post('notify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'QQ支付回调通知' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '返回处理结果',
  })
  async notify(@Body() body: Record<string, string>): Promise<string> {
    this.logger.log('Received QQ Pay notification');

    const result = this.qqPayService.verifyNotify(body);

    if (!result.isValid) {
      this.logger.warn('QQ Pay notification signature verification failed');
      return '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[签名验证失败]]></return_msg></xml>';
    }

    // 处理业务逻辑，更新订单状态
    if (result.data) {
      const { out_trade_no, trade_state, transaction_id, total_fee } = result.data;

      if (trade_state === 'SUCCESS' && out_trade_no && this.ordersService) {
        try {
          await this.ordersService.updatePaymentStatus(out_trade_no, OrderStatus.PAID, {
            paymentChannel: PaymentChannel.QQ,
            transactionId: transaction_id ?? '',
            paidAmount: parseInt(total_fee ?? '0', 10),
          });
          this.logger.log(`Order ${out_trade_no} payment status updated to PAID`);
        } catch (error) {
          this.logger.error(`Failed to update order ${out_trade_no}: ${error}`);
          return '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[订单更新失败]]></return_msg></xml>';
        }
      }
    }

    return '<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>';
  }
}

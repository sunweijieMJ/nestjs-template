import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  Headers,
  RawBodyRequest,
  Req,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WechatPayService } from './wechat-pay.service';
import { CreateWechatJsapiPaymentDto } from './dto/create-jsapi-payment.dto';
import { CreateWechatAppPaymentDto } from './dto/create-app-payment.dto';
import { WechatRefundDto } from './dto/wechat-refund.dto';
import { OrdersService } from '../../modules/orders/orders.service';
import { OrderStatus, PaymentChannel } from '../../modules/orders/domain/order';

@ApiTags('Wechat Pay')
@Controller({
  path: 'wechat',
  version: '1',
})
export class WechatPayController {
  private readonly logger = new Logger(WechatPayController.name);

  constructor(
    private readonly wechatPayService: WechatPayService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post('payment/jsapi')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '创建 JSAPI 支付订单（小程序/公众号）' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '返回支付参数',
  })
  async createJsapiPayment(@Body() dto: CreateWechatJsapiPaymentDto): Promise<{
    timeStamp: string;
    nonceStr: string;
    package: string;
    signType: string;
    paySign: string;
  }> {
    return this.wechatPayService.createJsapiPayment(dto);
  }

  @Post('payment/app')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '创建 APP 支付订单' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '返回支付参数',
  })
  async createAppPayment(@Body() dto: CreateWechatAppPaymentDto): Promise<{
    appid: string;
    partnerid: string;
    prepayid: string;
    package: string;
    noncestr: string;
    timestamp: string;
    sign: string;
  }> {
    return this.wechatPayService.createAppPayment(dto);
  }

  @Get('order/:outTradeNo')
  @ApiOperation({ summary: '查询订单状态' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '返回订单信息',
  })
  async queryOrder(@Param('outTradeNo') outTradeNo: string): Promise<{
    out_trade_no: string;
    transaction_id: string;
    trade_state: string;
    trade_state_desc: string;
    amount: {
      total: number;
      payer_total: number;
      currency: string;
    };
  }> {
    return this.wechatPayService.queryOrder(outTradeNo);
  }

  @Post('refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '申请退款' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '返回退款结果',
  })
  async refund(@Body() dto: WechatRefundDto): Promise<{
    refund_id: string;
    out_refund_no: string;
    transaction_id: string;
    out_trade_no: string;
    status: string;
  }> {
    return this.wechatPayService.refund(dto);
  }

  @Post('notify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '微信支付回调通知' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '返回处理结果',
  })
  async notify(
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<{ code: string; message: string }> {
    this.logger.log('Received WeChat Pay notification');

    const body = req.rawBody?.toString() ?? '';
    const result = this.wechatPayService.verifyNotify(headers, body);

    if (!result.isValid) {
      this.logger.warn('WeChat Pay notification signature verification failed');
      return { code: 'FAIL', message: '签名验证失败' };
    }

    // 处理业务逻辑，更新订单状态
    if (result.data?.resource) {
      const resource = result.data.resource as {
        out_trade_no?: string;
        trade_state?: string;
        transaction_id?: string;
        amount?: { total?: number; payer_total?: number };
      };

      const { out_trade_no, trade_state, transaction_id, amount } = resource;

      if (trade_state === 'SUCCESS' && out_trade_no) {
        try {
          await this.ordersService.updatePaymentStatus(out_trade_no, OrderStatus.PAID, {
            paymentChannel: PaymentChannel.WECHAT,
            transactionId: transaction_id ?? '',
            paidAmount: amount?.payer_total ?? amount?.total ?? 0,
          });
          this.logger.log(`Order ${out_trade_no} payment status updated to PAID`);
        } catch (error) {
          this.logger.error(`Failed to update order ${out_trade_no}: ${error}`);
          return { code: 'FAIL', message: '订单更新失败' };
        }
      }
    }

    return { code: 'SUCCESS', message: '成功' };
  }
}

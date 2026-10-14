import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  Header,
  Logger,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AlipayService, AlipayPaymentParams } from '../../integrations/alipay/alipay.service';
import { CreatePaymentDto } from './dto/alipay-create-payment.dto';
import { RefundDto } from './dto/alipay-refund.dto';
import { OrdersService } from '../orders/orders.service';
import { Order, PaymentChannel } from '../orders/domain/order';
import { PaymentsService } from './payments.service';
import { fenToYuan, yuanToFen } from './money.utils';
import type { RequestWithUser } from '../../common/types/request-with-user.type';
import { PermissionsGuard } from '../../core/permissions/permissions.guard';
import { RequirePermissions } from '../../core/permissions/permissions.decorator';
import { Permission } from '../../core/permissions/permission.enum';
import { SkipResponseTransform } from '../../common/decorators/skip-response-transform.decorator';

@ApiTags('Alipay')
@Controller({
  path: 'alipay',
  version: '1',
})
export class AlipayController {
  private readonly logger = new Logger(AlipayController.name);

  constructor(
    private readonly alipayService: AlipayService,
    private readonly ordersService: OrdersService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('payment/mobile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '创建手机网站支付订单' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '返回支付表单 HTML',
  })
  async createMobilePayment(
    @Request() request: RequestWithUser,
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<{ form: string }> {
    const order = await this.ordersService.findPayableOrder(createPaymentDto.outTradeNo, request.user.id);
    const form = this.alipayService.createMobilePayment(this.toPaymentParams(createPaymentDto, order));
    return { form };
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('payment/web')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '创建电脑网站支付订单' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '返回支付表单 HTML',
  })
  async createWebPayment(
    @Request() request: RequestWithUser,
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<{ form: string }> {
    const order = await this.ordersService.findPayableOrder(createPaymentDto.outTradeNo, request.user.id);
    const form = this.alipayService.createWebPayment(this.toPaymentParams(createPaymentDto, order));
    return { form };
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('order/:outTradeNo')
  @ApiOperation({ summary: '查询订单状态' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '返回订单信息',
  })
  async queryOrder(
    @Request() request: RequestWithUser,
    @Param('outTradeNo') outTradeNo: string,
  ): Promise<{
    trade_no: string;
    out_trade_no: string;
    trade_status: string;
    total_amount: string;
  }> {
    const order = await this.ordersService.findOwnedByOrderNo(outTradeNo, request.user.id);
    return this.alipayService.queryOrder(order.orderNo);
  }

  @ApiBearerAuth()
  @RequirePermissions(Permission.PAYMENT_REFUND)
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Post('refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '申请退款（管理员）' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '返回退款结果',
  })
  async refund(@Body() refundDto: RefundDto): Promise<Record<string, unknown>> {
    const result = await this.paymentsService.refund(PaymentChannel.ALIPAY, {
      orderNo: refundDto.outTradeNo,
      refundNo: refundDto.outRequestNo,
      refundAmount: yuanToFen(refundDto.refundAmount),
      reason: refundDto.refundReason,
    });
    return result.raw;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('order/close/:outTradeNo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '关闭订单' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '返回关闭结果',
  })
  async closeOrder(
    @Request() request: RequestWithUser,
    @Param('outTradeNo') outTradeNo: string,
  ): Promise<{
    trade_no: string;
    out_trade_no: string;
  }> {
    const order = await this.ordersService.findPayableOrder(outTradeNo, request.user.id);
    return this.alipayService.closeOrder(order.orderNo);
  }

  @Post('notify')
  @HttpCode(HttpStatus.OK)
  @SkipResponseTransform()
  @Header('Content-Type', 'text/plain')
  @ApiOperation({ summary: '支付宝异步通知回调' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '返回处理结果',
  })
  async notify(@Body() body: Record<string, string>): Promise<string> {
    this.logger.log('Received Alipay notification');

    // 支付宝回调参数在 body 中，不需要合并 query
    const isValid = this.alipayService.verifyNotify(body);

    if (!isValid) {
      this.logger.warn('Alipay notification signature verification failed');
      return 'fail';
    }

    const { out_trade_no, trade_status, trade_no, total_amount } = body;

    // 更新订单支付状态
    if (trade_status === 'TRADE_SUCCESS' || trade_status === 'TRADE_FINISHED') {
      try {
        await this.paymentsService.confirmPaid({
          channel: PaymentChannel.ALIPAY,
          orderNo: out_trade_no,
          transactionId: trade_no,
          paidAmount: yuanToFen(total_amount),
        });
      } catch (error) {
        this.logger.error(`Failed to update order ${out_trade_no}: ${error}`);
        // 返回 fail 让支付宝重试
        return 'fail';
      }
    }

    return 'success';
  }

  private toPaymentParams(dto: CreatePaymentDto, order: Order): AlipayPaymentParams {
    return {
      outTradeNo: order.orderNo,
      subject: dto.subject,
      totalAmount: fenToYuan(order.totalAmount),
      body: dto.body,
      timeExpire: order.expiresAt,
    };
  }
}

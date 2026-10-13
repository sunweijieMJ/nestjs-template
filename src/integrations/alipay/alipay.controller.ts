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
import { AlipayService } from './alipay.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundDto } from './dto/refund.dto';
import { OrdersService } from '../../modules/orders/orders.service';
import { Order, OrderStatus, PaymentChannel } from '../../modules/orders/domain/order';
import { RequestWithUser } from '../../common/types/request-with-user.type';
import { Roles } from '../../common/enums/roles/roles.decorator';
import { RoleEnum } from '../../common/enums/roles/roles.enum';
import { RolesGuard } from '../../common/enums/roles/roles.guard';
import { SkipResponseTransform } from '../../common/decorators/skip-response-transform.decorator';

/** 分转元，保留两位小数 */
function fenToYuan(fen: number): string {
  return (fen / 100).toFixed(2);
}

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
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post('refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '申请退款（管理员）' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '返回退款结果',
  })
  async refund(@Body() refundDto: RefundDto): Promise<{
    trade_no: string;
    out_trade_no: string;
    refund_fee: string;
  }> {
    const refundAmount = Math.round(parseFloat(refundDto.refundAmount) * 100);
    const order = await this.ordersService.findRefundableOrder(refundDto.outTradeNo, refundAmount);
    const result = await this.alipayService.refund({
      ...refundDto,
      outRequestNo: `${order.orderNo}_R${Date.now()}`,
    });
    if (refundAmount === (order.paidAmount ?? order.totalAmount)) {
      await this.ordersService.markRefunded(order);
    }
    return result;
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
        await this.ordersService.updatePaymentStatus(out_trade_no, OrderStatus.PAID, {
          paymentChannel: PaymentChannel.ALIPAY,
          transactionId: trade_no,
          paidAmount: Math.round(parseFloat(total_amount) * 100), // 转为分
        });
        this.logger.log(`Order ${out_trade_no} payment status updated to PAID`);
      } catch (error) {
        this.logger.error(`Failed to update order ${out_trade_no}: ${error}`);
        // 返回 fail 让支付宝重试
        return 'fail';
      }
    }

    return 'success';
  }

  private toPaymentParams(
    dto: CreatePaymentDto,
    order: Order,
  ): { outTradeNo: string; subject: string; totalAmount: string; body?: string } {
    return {
      outTradeNo: order.orderNo,
      subject: dto.subject,
      totalAmount: fenToYuan(order.totalAmount),
      body: dto.body,
    };
  }
}

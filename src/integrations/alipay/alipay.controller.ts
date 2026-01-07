import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AlipayService } from './alipay.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundDto } from './dto/refund.dto';

@ApiTags('Alipay')
@Controller({
  path: 'alipay',
  version: '1',
})
export class AlipayController {
  constructor(private readonly alipayService: AlipayService) {}

  @Post('payment/mobile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '创建手机网站支付订单' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '返回支付表单 HTML',
  })
  createMobilePayment(@Body() createPaymentDto: CreatePaymentDto): { form: string } {
    const form = this.alipayService.createMobilePayment(createPaymentDto);
    return { form };
  }

  @Post('payment/web')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '创建电脑网站支付订单' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '返回支付表单 HTML',
  })
  createWebPayment(@Body() createPaymentDto: CreatePaymentDto): { form: string } {
    const form = this.alipayService.createWebPayment(createPaymentDto);
    return { form };
  }

  @Get('order/:outTradeNo')
  @ApiOperation({ summary: '查询订单状态' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '返回订单信息',
  })
  async queryOrder(@Param('outTradeNo') outTradeNo: string): Promise<{
    trade_no: string;
    out_trade_no: string;
    trade_status: string;
    total_amount: string;
  }> {
    return this.alipayService.queryOrder(outTradeNo);
  }

  @Post('refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '申请退款' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '返回退款结果',
  })
  async refund(@Body() refundDto: RefundDto): Promise<{
    trade_no: string;
    out_trade_no: string;
    refund_fee: string;
  }> {
    return this.alipayService.refund(refundDto);
  }

  @Post('order/close/:outTradeNo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '关闭订单' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '返回关闭结果',
  })
  async closeOrder(@Param('outTradeNo') outTradeNo: string): Promise<{
    trade_no: string;
    out_trade_no: string;
  }> {
    return this.alipayService.closeOrder(outTradeNo);
  }

  @Post('notify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '支付宝异步通知回调' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '返回处理结果',
  })
  async notify(@Body() body: Record<string, string>): Promise<string> {
    // 支付宝回调参数在 body 中，不需要合并 query
    const isValid = this.alipayService.verifyNotify(body);

    if (!isValid) {
      return 'fail';
    }

    // 处理业务逻辑，例如更新订单状态
    // const { out_trade_no, trade_status } = body;
    // TODO: 调用订单服务更新订单状态

    return 'success';
  }
}

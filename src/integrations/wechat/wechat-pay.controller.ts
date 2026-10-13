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
  Request,
  Logger,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { WechatPayService, WechatEncryptedResource, WechatTransactionResource } from './wechat-pay.service';
import { CreateWechatJsapiPaymentDto } from './dto/create-jsapi-payment.dto';
import { CreateWechatAppPaymentDto } from './dto/create-app-payment.dto';
import { WechatRefundDto } from './dto/wechat-refund.dto';
import { OrdersService } from '../../modules/orders/orders.service';
import { OrderStatus, PaymentChannel } from '../../modules/orders/domain/order';
import { RequestWithUser } from '../../common/types/request-with-user.type';
import { Roles } from '../../common/enums/roles/roles.decorator';
import { RoleEnum } from '../../common/enums/roles/roles.enum';
import { RolesGuard } from '../../common/enums/roles/roles.guard';
import { SkipResponseTransform } from '../../common/decorators/skip-response-transform.decorator';

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

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('payment/jsapi')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '创建 JSAPI 支付订单（小程序/公众号）' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '返回支付参数',
  })
  async createJsapiPayment(
    @Request() request: RequestWithUser,
    @Body() dto: CreateWechatJsapiPaymentDto,
  ): Promise<{
    timeStamp: string;
    nonceStr: string;
    package: string;
    signType: string;
    paySign: string;
  }> {
    const order = await this.ordersService.findPayableOrder(dto.outTradeNo, request.user.id);
    return this.wechatPayService.createJsapiPayment({
      openid: dto.openid,
      outTradeNo: order.orderNo,
      description: dto.description,
      amount: order.totalAmount,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('payment/app')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '创建 APP 支付订单' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '返回支付参数',
  })
  async createAppPayment(
    @Request() request: RequestWithUser,
    @Body() dto: CreateWechatAppPaymentDto,
  ): Promise<{
    appid: string;
    partnerid: string;
    prepayid: string;
    package: string;
    noncestr: string;
    timestamp: string;
    sign: string;
  }> {
    const order = await this.ordersService.findPayableOrder(dto.outTradeNo, request.user.id);
    return this.wechatPayService.createAppPayment({
      outTradeNo: order.orderNo,
      description: dto.description,
      amount: order.totalAmount,
    });
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
    const order = await this.ordersService.findOwnedByOrderNo(outTradeNo, request.user.id);
    return this.wechatPayService.queryOrder(order.orderNo);
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
  async refund(@Body() dto: WechatRefundDto): Promise<{
    refund_id: string;
    out_refund_no: string;
    transaction_id: string;
    out_trade_no: string;
    status: string;
  }> {
    const order = await this.ordersService.findRefundableOrder(dto.outTradeNo, dto.refundAmount);
    const result = await this.wechatPayService.refund({
      outTradeNo: order.orderNo,
      outRefundNo: dto.outRefundNo,
      refundAmount: dto.refundAmount,
      totalAmount: order.totalAmount,
      reason: dto.reason,
    });
    if (result.status === 'SUCCESS' && dto.refundAmount === (order.paidAmount ?? order.totalAmount)) {
      await this.ordersService.markRefunded(order);
    }
    return result;
  }

  @Post('notify')
  @HttpCode(HttpStatus.OK)
  @SkipResponseTransform()
  @ApiOperation({ summary: '微信支付回调通知' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '处理成功；验签失败或处理失败时返回 4xx/5xx，微信会重试',
  })
  async notify(
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<{ code: string; message: string }> {
    this.logger.log('Received WeChat Pay notification');

    const body = req.rawBody?.toString() ?? '';
    const result = await this.wechatPayService.verifyNotify(headers, body);

    if (!result.isValid) {
      this.logger.warn('WeChat Pay notification signature verification failed');
      throw new UnauthorizedException({ code: 'FAIL', message: '签名验证失败' });
    }

    const resource = result.data?.resource as WechatEncryptedResource | undefined;
    if (!resource) {
      return { code: 'SUCCESS', message: '成功' };
    }

    let transaction: WechatTransactionResource;
    try {
      transaction = this.wechatPayService.parseTransactionResource(resource);
    } catch (error) {
      this.logger.error(`Failed to decrypt WeChat Pay notification: ${error}`);
      throw new BadRequestException({ code: 'FAIL', message: '解密失败' });
    }

    const { out_trade_no, trade_state, transaction_id, amount } = transaction;
    if (trade_state === 'SUCCESS' && out_trade_no) {
      try {
        await this.ordersService.updatePaymentStatus(out_trade_no, OrderStatus.PAID, {
          paymentChannel: PaymentChannel.WECHAT,
          transactionId: transaction_id ?? '',
          paidAmount: amount?.total ?? 0,
        });
        this.logger.log(`Order ${out_trade_no} payment status updated to PAID`);
      } catch (error) {
        this.logger.error(`Failed to update order ${out_trade_no}: ${error}`);
        throw new InternalServerErrorException({ code: 'FAIL', message: '订单更新失败' });
      }
    }

    return { code: 'SUCCESS', message: '成功' };
  }
}

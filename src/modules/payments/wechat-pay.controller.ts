import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  Headers,
  Req,
  Request,
  Logger,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import {
  WechatPayService,
  WechatEncryptedResource,
  WechatTransactionResource,
} from '../../integrations/wechat/wechat-pay.service';
import { CreateWechatJsapiPaymentDto } from './dto/create-jsapi-payment.dto';
import { WechatAppPaymentResponseDto, WechatJsapiPaymentResponseDto } from './dto/wechat-payment-response.dto';
import { WechatService } from '../../integrations/wechat/wechat.service';
import { CreateWechatAppPaymentDto } from './dto/create-app-payment.dto';
import { WechatRefundDto } from './dto/wechat-refund.dto';
import { OrdersService } from '../orders/orders.service';
import { PaymentChannel } from '../orders/domain/order';
import { PaymentsService } from './payments.service';
import type { RequestWithUser } from '../../common/types/request-with-user.type';
import { PermissionsGuard } from '../../core/permissions/permissions.guard';
import { RequirePermissions } from '../../core/permissions/permissions.decorator';
import { Permission } from '../../core/permissions/permission.enum';
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
    private readonly wechatService: WechatService,
    private readonly ordersService: OrdersService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('payment/jsapi')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '创建 JSAPI 支付订单（小程序）' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: WechatJsapiPaymentResponseDto,
  })
  async createJsapiPayment(
    @Request() request: RequestWithUser,
    @Body() dto: CreateWechatJsapiPaymentDto,
  ): Promise<WechatJsapiPaymentResponseDto> {
    const order = await this.ordersService.findPayableOrder(dto.outTradeNo, request.user.id);
    const { openId } = await this.wechatService.miniAppLogin(dto.code);
    return this.wechatPayService.createJsapiPayment({
      openid: openId,
      outTradeNo: order.orderNo,
      description: dto.description,
      amount: order.totalAmount,
      timeExpire: order.expiresAt,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('payment/app')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '创建 APP 支付订单' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: WechatAppPaymentResponseDto,
  })
  async createAppPayment(
    @Request() request: RequestWithUser,
    @Body() dto: CreateWechatAppPaymentDto,
  ): Promise<WechatAppPaymentResponseDto> {
    const order = await this.ordersService.findPayableOrder(dto.outTradeNo, request.user.id);
    return this.wechatPayService.createAppPayment({
      outTradeNo: order.orderNo,
      description: dto.description,
      amount: order.totalAmount,
      timeExpire: order.expiresAt,
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
  @RequirePermissions(Permission.PAYMENT_REFUND)
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Post('refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '申请退款（管理员）' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '返回退款结果',
  })
  async refund(@Body() dto: WechatRefundDto): Promise<Record<string, unknown>> {
    const result = await this.paymentsService.refund(PaymentChannel.WECHAT, {
      orderNo: dto.outTradeNo,
      refundNo: dto.outRefundNo,
      refundAmount: dto.refundAmount,
      reason: dto.reason,
    });
    return result.raw;
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

    const { out_trade_no, trade_state, refund_status, out_refund_no, transaction_id, amount } = transaction;
    try {
      if (trade_state === 'SUCCESS' && out_trade_no) {
        await this.paymentsService.confirmPaid({
          channel: PaymentChannel.WECHAT,
          orderNo: out_trade_no,
          transactionId: transaction_id ?? '',
          paidAmount: amount?.total ?? 0,
        });
      } else if (refund_status === 'SUCCESS' && out_trade_no && out_refund_no) {
        await this.paymentsService.confirmRefunded({
          channel: PaymentChannel.WECHAT,
          orderNo: out_trade_no,
          transactionId: transaction_id ?? '',
          refundNo: out_refund_no,
          refundAmount: amount?.refund ?? 0,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to update order ${out_trade_no}: ${error}`);
      throw new InternalServerErrorException({ code: 'FAIL', message: '订单更新失败' });
    }

    return { code: 'SUCCESS', message: '成功' };
  }
}

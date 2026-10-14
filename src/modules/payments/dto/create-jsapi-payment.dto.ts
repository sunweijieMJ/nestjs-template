import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateWechatJsapiPaymentDto {
  @ApiProperty({
    description: '小程序 wx.login 返回的 code，用于确定付款用户的 openid',
    example: '0a3Xxx',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: '商户订单号（即订单的 orderNo），支付金额取订单金额',
    example: 'ORDER_20260107_123456',
  })
  @IsString()
  @IsNotEmpty()
  outTradeNo: string;

  @ApiProperty({
    description: '商品描述',
    example: '购买会员服务',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}

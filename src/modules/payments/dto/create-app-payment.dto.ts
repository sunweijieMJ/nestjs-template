import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateWechatAppPaymentDto {
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

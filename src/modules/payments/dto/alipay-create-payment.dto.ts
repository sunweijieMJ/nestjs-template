import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    description: '商户订单号（即订单的 orderNo），支付金额取订单金额',
    example: 'ORDER_20260107_123456',
  })
  @IsString()
  @IsNotEmpty()
  outTradeNo: string;

  @ApiProperty({
    description: '订单标题',
    example: '购买会员服务',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: '订单描述',
    example: '购买一年期会员服务',
    required: false,
  })
  @IsString()
  @IsOptional()
  body?: string;
}

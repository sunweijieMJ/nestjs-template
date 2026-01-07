import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';

export class WechatRefundDto {
  @ApiProperty({
    description: '商户订单号',
    example: 'ORDER_20260107_123456',
  })
  @IsString()
  @IsNotEmpty()
  outTradeNo: string;

  @ApiProperty({
    description: '商户退款单号',
    example: 'REFUND_20260107_123456',
  })
  @IsString()
  @IsNotEmpty()
  outRefundNo: string;

  @ApiProperty({
    description: '退款金额（分）',
    example: 9900,
  })
  @IsNumber()
  @Min(1)
  refundAmount: number;

  @ApiProperty({
    description: '订单总金额（分）',
    example: 9900,
  })
  @IsNumber()
  @Min(1)
  totalAmount: number;

  @ApiProperty({
    description: '退款原因',
    example: '用户申请退款',
    required: false,
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

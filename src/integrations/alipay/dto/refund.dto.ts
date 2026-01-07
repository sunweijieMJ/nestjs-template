import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class RefundDto {
  @ApiProperty({
    description: '商户订单号',
    example: 'ORDER_20260107_123456',
  })
  @IsString()
  @IsNotEmpty()
  outTradeNo: string;

  @ApiProperty({
    description: '退款金额（元）',
    example: '99.00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: '金额格式不正确，应为数字，最多两位小数',
  })
  refundAmount: string;

  @ApiProperty({
    description: '退款原因',
    example: '用户申请退款',
    required: false,
  })
  @IsString()
  @IsOptional()
  refundReason?: string;
}

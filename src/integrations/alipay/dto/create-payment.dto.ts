import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    description: '商户订单号（唯一）',
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
    description: '订单金额（元）',
    example: '99.00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: '金额格式不正确，应为数字，最多两位小数',
  })
  totalAmount: string;

  @ApiProperty({
    description: '订单描述',
    example: '购买一年期会员服务',
    required: false,
  })
  @IsString()
  @IsOptional()
  body?: string;
}

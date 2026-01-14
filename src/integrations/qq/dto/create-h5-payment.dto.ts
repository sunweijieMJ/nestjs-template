import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateQqH5PaymentDto {
  @ApiProperty({
    description: '商户订单号',
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

  @ApiProperty({
    description: '订单金额（分）',
    example: 9900,
  })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({
    description: '用户 OpenID',
    example: 'XXXXXX',
  })
  @IsString()
  @IsOptional()
  openid?: string;
}

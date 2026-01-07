import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateWechatJsapiPaymentDto {
  @ApiProperty({
    description: '用户 OpenID',
    example: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
  })
  @IsString()
  @IsNotEmpty()
  openid: string;

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
}

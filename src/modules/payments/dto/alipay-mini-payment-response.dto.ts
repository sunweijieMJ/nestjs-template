import { ApiProperty } from '@nestjs/swagger';

export class AlipayMiniPaymentResponseDto {
  @ApiProperty({
    description: '支付宝交易号，供小程序 my.tradePay 拉起收银台',
    example: '2026101422001400000000000001',
  })
  tradeNo: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { CreatePaymentDto } from './alipay-create-payment.dto';

export class CreateMiniPaymentDto extends CreatePaymentDto {
  @ApiProperty({
    description: '支付宝小程序 my.getAuthCode（auth_base）返回的授权码，用于确定付款用户',
    example: '4b203fe6c11548bcabd8da5bb087a83b',
  })
  @IsString()
  @IsNotEmpty()
  authCode: string;
}

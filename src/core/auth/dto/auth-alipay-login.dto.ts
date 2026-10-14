import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AuthAlipayLoginDto {
  @ApiProperty({
    example: '4b203fe6c11548bcabd8da5bb087a83b',
    description: '支付宝小程序 my.getAuthCode 返回的授权码',
  })
  @IsNotEmpty()
  @IsString()
  authCode: string;
}

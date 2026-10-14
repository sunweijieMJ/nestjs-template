import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AuthWechatPhoneLoginDto {
  @ApiProperty({
    example: '0a3Xxx',
    description: 'wx.login 返回的 code，用于获取 openid',
  })
  @IsNotEmpty()
  @IsString()
  loginCode: string;

  @ApiProperty({
    example: 'e31968a7f94cc5ee25fafc2aef2773f0bb8c3937b22520eb8ee345274d00c144',
    description: '手机号快速验证组件（getPhoneNumber）返回的 code',
  })
  @IsNotEmpty()
  @IsString()
  phoneCode: string;
}

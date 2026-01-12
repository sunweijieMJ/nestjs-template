import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, IsEnum, IsOptional } from 'class-validator';
import { SmsCodeType } from '../../../integrations/sms/sms.service';

export class AuthSendCodeDto {
  @ApiProperty({ example: '13800138000', type: String })
  @IsNotEmpty()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: 'phone must be a valid Chinese mobile number' })
  phone: string;

  @ApiProperty({
    example: SmsCodeType.LOGIN,
    enum: SmsCodeType,
    required: false,
    description: '验证码类型: login(登录), register(注册), reset_password(重置密码), change_phone(换绑手机)',
  })
  @IsOptional()
  @IsEnum(SmsCodeType)
  type?: SmsCodeType;
}

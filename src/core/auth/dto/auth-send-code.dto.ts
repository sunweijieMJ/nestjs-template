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
    example: 'login',
    enum: SmsCodeType,
    description: 'Code type: login, register, reset_password, change_phone',
  })
  @IsOptional()
  @IsEnum(SmsCodeType)
  type?: SmsCodeType;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { IsStrongPassword } from '../../../common/validators/password-strength.validator';

/**
 * 手机验证码重置密码 DTO
 */
export class AuthPhoneResetPasswordDto {
  @ApiProperty({ example: '13800138000', description: '手机号' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: 'phone must be a valid Chinese mobile number' })
  phone: string;

  @ApiProperty({ example: '123456', description: '短信验证码' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4,8}$/, { message: 'code must be 4-8 digits' })
  code: string;

  @ApiProperty({ example: 'NewPassword123', description: '新密码' })
  @IsNotEmpty()
  @IsStrongPassword()
  password: string;
}

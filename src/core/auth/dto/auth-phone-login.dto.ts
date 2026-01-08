import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { IsMd5Password } from '../../../common/validators/md5-password.validator';

export class AuthPhoneLoginDto {
  @ApiProperty({ example: '13800138000', type: String })
  @IsNotEmpty()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: 'phone must be a valid Chinese mobile number' })
  phone: string;

  @ApiProperty({ example: '5f4dcc3b5aa765d61d8327deb882cf99', description: 'MD5 encrypted password' })
  @IsNotEmpty()
  @IsMd5Password()
  password: string;
}

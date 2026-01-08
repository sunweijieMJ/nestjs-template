import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { IsMd5Password } from '../../../common/validators/md5-password.validator';

export class AuthResetPasswordDto {
  @ApiProperty({ example: '5f4dcc3b5aa765d61d8327deb882cf99', description: 'MD5 encrypted password' })
  @IsNotEmpty()
  @IsMd5Password()
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  hash: string;
}

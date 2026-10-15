import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsMd5Password } from '../../../common/validators/md5-password.validator';
import { md5PasswordTransformer } from '../../../common/transformers/md5-password.transformer';

export class AuthResetPasswordDto {
  @ApiProperty({ example: '5f4dcc3b5aa765d61d8327deb882cf99', description: 'MD5 encrypted password' })
  @IsNotEmpty()
  @IsMd5Password()
  @Transform(md5PasswordTransformer)
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  hash: string;
}

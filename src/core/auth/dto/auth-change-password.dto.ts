import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsMd5Password } from '../../../common/validators/md5-password.validator';
import { md5PasswordTransformer } from '../../../common/transformers/md5-password.transformer';

export class AuthChangePasswordDto {
  @ApiProperty({ example: '5f4dcc3b5aa765d61d8327deb882cf99', description: 'MD5 encrypted old password' })
  @IsNotEmpty()
  @IsMd5Password()
  @Transform(md5PasswordTransformer)
  oldPassword: string;

  @ApiProperty({ example: '5f4dcc3b5aa765d61d8327deb882cf99', description: 'MD5 encrypted new password' })
  @IsNotEmpty()
  @IsMd5Password()
  @Transform(md5PasswordTransformer)
  newPassword: string;
}

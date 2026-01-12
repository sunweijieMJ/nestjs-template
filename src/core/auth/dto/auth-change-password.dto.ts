import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { IsMd5Password } from '../../../common/validators/md5-password.validator';

export class AuthChangePasswordDto {
  @ApiProperty({ example: '5f4dcc3b5aa765d61d8327deb882cf99', description: 'MD5 encrypted old password' })
  @IsNotEmpty()
  @IsMd5Password()
  oldPassword: string;

  @ApiProperty({ example: '5f4dcc3b5aa765d61d8327deb882cf99', description: 'MD5 encrypted new password' })
  @IsNotEmpty()
  @IsMd5Password()
  newPassword: string;
}

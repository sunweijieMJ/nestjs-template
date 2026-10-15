import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsMd5Password } from '../../../common/validators/md5-password.validator';
import { md5PasswordTransformer } from '../../../common/transformers/md5-password.transformer';

export class AuthDeleteAccountDto {
  @ApiPropertyOptional({
    example: '5f4dcc3b5aa765d61d8327deb882cf99',
    description: 'MD5 encrypted current password, required when the user has a password',
  })
  @IsOptional()
  @IsNotEmpty({ message: 'mustBeNotEmpty' })
  @IsMd5Password()
  @Transform(md5PasswordTransformer)
  oldPassword?: string;

  @ApiPropertyOptional({
    example: '123456',
    description: 'verify_identity SMS code sent to the bound phone, required when the user has no password',
  })
  @IsOptional()
  @IsString()
  @Length(4, 8)
  smsCode?: string;
}

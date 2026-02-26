import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, Length, MaxLength } from 'class-validator';

import { Transform } from 'class-transformer';
import { sanitizeTransformer } from '../../../common/transformers/sanitize.transformer';
import { IsMd5Password } from '../../../common/validators/md5-password.validator';

export class AuthPhoneRegisterDto {
  @ApiProperty({ example: '13800138000', type: String })
  @IsNotEmpty()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: 'phone must be a valid Chinese mobile number' })
  phone: string;

  @ApiProperty({
    example: '123456',
    type: String,
    description: 'SMS verification code',
  })
  @IsNotEmpty()
  @IsString()
  @Length(4, 8)
  code: string;

  @ApiProperty({ example: '5f4dcc3b5aa765d61d8327deb882cf99', description: 'MD5 encrypted password' })
  @IsNotEmpty()
  @IsMd5Password()
  password: string;

  @ApiPropertyOptional({ example: 'Johnny', type: String })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(sanitizeTransformer)
  nickname?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from '../../../common/transformers/lower-case.transformer';
import { IsMd5Password } from '../../../common/validators/md5-password.validator';

export class AuthEmailLoginDto {
  @ApiProperty({ example: 'test1@example.com', type: String })
  @Transform(lowerCaseTransformer)
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '5f4dcc3b5aa765d61d8327deb882cf99', description: 'MD5 encrypted password' })
  @IsNotEmpty()
  @IsMd5Password()
  password: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from '../../../common/transformers/lower-case.transformer';
import { sanitizeTransformer } from '../../../common/transformers/sanitize.transformer';
import { IsMd5Password } from '../../../common/validators/md5-password.validator';

export class AuthRegisterLoginDto {
  @ApiProperty({ example: 'test1@example.com', type: String })
  @Transform(lowerCaseTransformer)
  @IsEmail()
  email: string;

  @ApiProperty({ example: '5f4dcc3b5aa765d61d8327deb882cf99', description: 'MD5 encrypted password' })
  @IsMd5Password()
  password: string;

  @ApiProperty({ example: 'John' })
  @Transform(sanitizeTransformer)
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @Transform(sanitizeTransformer)
  @IsNotEmpty()
  lastName: string;
}

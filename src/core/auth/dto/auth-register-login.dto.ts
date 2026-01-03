import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from '../../../common/transformers/lower-case.transformer';
import { sanitizeTransformer } from '../../../common/transformers/sanitize.transformer';
import { IsStrongPassword } from '../../../common/validators/password-strength.validator';

export class AuthRegisterLoginDto {
  @ApiProperty({ example: 'test1@example.com', type: String })
  @Transform(lowerCaseTransformer)
  @IsEmail()
  email: string;

  @ApiProperty()
  @MinLength(8)
  @MaxLength(128)
  @IsStrongPassword()
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

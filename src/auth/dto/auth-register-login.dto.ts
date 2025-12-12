import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from '../../utils/transformers/lower-case.transformer';
import { sanitizeTransformer } from '../../utils/transformers/sanitize.transformer';

export class AuthRegisterLoginDto {
  @ApiProperty({ example: 'test1@example.com', type: String })
  @Transform(lowerCaseTransformer)
  @IsEmail()
  email: string;

  @ApiProperty()
  @MinLength(8)
  @MaxLength(128)
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

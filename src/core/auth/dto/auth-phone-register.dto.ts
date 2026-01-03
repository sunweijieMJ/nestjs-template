import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, Length, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeTransformer } from '../../../common/transformers/sanitize.transformer';
import { IsStrongPassword } from '../../../common/validators/password-strength.validator';

export class AuthPhoneRegisterDto {
  @ApiProperty({ example: '13800138000', type: String })
  @IsNotEmpty()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: 'phone must be a valid Chinese mobile number' })
  phone: string;

  @ApiPropertyOptional({
    example: '123456',
    type: String,
    description: 'SMS verification code (optional, required for code-based registration)',
  })
  @IsOptional()
  @IsString()
  @Length(4, 8)
  code?: string;

  @ApiProperty()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  @IsStrongPassword()
  password: string;

  @ApiPropertyOptional({ example: 'Johnny', type: String })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(sanitizeTransformer)
  nickname?: string;
}

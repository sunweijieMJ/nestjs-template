import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { IsStrongPassword } from '../../../common/validators/password-strength.validator';

export class AuthResetPasswordDto {
  @ApiProperty({ example: 'NewPassword123' })
  @IsNotEmpty()
  @IsStrongPassword()
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  hash: string;
}

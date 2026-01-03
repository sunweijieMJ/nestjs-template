import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class AuthPhoneLoginDto {
  @ApiProperty({ example: '13800138000', type: String })
  @IsNotEmpty()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: 'phone must be a valid Chinese mobile number' })
  phone: string;

  @ApiProperty()
  @IsNotEmpty()
  password: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum QqLoginType {
  WEB = 'web',
  APP = 'app',
  MINI_APP = 'mini_app',
}

export class AuthQqLoginDto {
  @ApiProperty({
    enum: QqLoginType,
    example: QqLoginType.APP,
    description: 'QQ login type (web, app or mini_app)',
  })
  @IsEnum(QqLoginType)
  @IsNotEmpty()
  type: QqLoginType;

  @ApiPropertyOptional({
    example: '0x1234567890',
    description: 'QQ authorization code (required for web and mini_app login)',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/callback',
    description: 'Redirect URI (required for web login, must match the one used to get code)',
  })
  @IsOptional()
  @IsString()
  redirectUri?: string;

  @ApiPropertyOptional({
    example: 'ACCESS_TOKEN',
    description: 'QQ access token (required for app login)',
  })
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiPropertyOptional({
    example: 'XXXXXX',
    description: 'QQ openid (required for app login)',
  })
  @IsOptional()
  @IsString()
  openId?: string;

  @ApiPropertyOptional({
    example: 'XXXXXX',
    description: 'QQ unionid (optional for app login, if SDK returns it)',
  })
  @IsOptional()
  @IsString()
  unionId?: string;

  @ApiPropertyOptional({
    example: 'QQ用户',
    description: 'User nickname (optional, for first-time registration)',
  })
  @IsOptional()
  @IsString()
  nickname?: string;
}

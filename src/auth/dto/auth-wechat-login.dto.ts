import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum WechatLoginType {
  MINI_APP = 'mini_app',
  APP = 'app',
}

export class AuthWechatLoginDto {
  @ApiProperty({
    example: '0x1234567890',
    description: 'WeChat authorization code',
  })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({
    enum: WechatLoginType,
    example: WechatLoginType.MINI_APP,
    description: 'WeChat login type (mini_app or app)',
  })
  @IsEnum(WechatLoginType)
  @IsNotEmpty()
  type: WechatLoginType;

  @ApiPropertyOptional({
    example: '微信用户',
    description: 'User nickname (optional, for first-time registration)',
  })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'User avatar URL (optional, for first-time registration)',
  })
  @IsOptional()
  @IsString()
  avatar?: string;
}

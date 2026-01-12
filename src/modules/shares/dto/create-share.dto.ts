import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsNotEmpty, IsOptional, IsObject, MaxLength, IsUrl, IsDateString } from 'class-validator';
import { ShareTargetType, SharePlatform } from '../domain/share';

export class CreateShareDto {
  @ApiProperty({
    enum: ShareTargetType,
    example: ShareTargetType.PRODUCT,
  })
  @IsEnum(ShareTargetType)
  targetType: ShareTargetType;

  @ApiProperty({
    example: '123',
    description: 'ID of the target content',
  })
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @ApiProperty({
    enum: SharePlatform,
    example: SharePlatform.WECHAT,
  })
  @IsEnum(SharePlatform)
  platform: SharePlatform;

  @ApiProperty({
    example: 'Check out this amazing product!',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    example: 'This is a great product with excellent features.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/images/product.jpg',
  })
  @IsOptional()
  @IsUrl()
  image?: string;

  @ApiProperty({
    example: 'https://example.com/products/123',
  })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({
    type: Object,
    description: 'Additional metadata in JSON format',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: '2026-12-31T23:59:59Z',
    description: 'Expiration timestamp for this share',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

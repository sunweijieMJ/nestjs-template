import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ShareTargetType, SharePlatform } from '../domain/share';

export class QueryShareDto {
  @ApiPropertyOptional({
    type: Number,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : 1))
  page?: number = 1;

  @ApiPropertyOptional({
    type: Number,
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : 10))
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: ShareTargetType,
    description: 'Filter by target type',
  })
  @IsOptional()
  @IsEnum(ShareTargetType)
  targetType?: ShareTargetType;

  @ApiPropertyOptional({
    enum: SharePlatform,
    description: 'Filter by platform',
  })
  @IsOptional()
  @IsEnum(SharePlatform)
  platform?: SharePlatform;

  @ApiPropertyOptional({
    type: String,
    description: 'Filter by target ID',
  })
  @IsOptional()
  @IsString()
  targetId?: string;
}

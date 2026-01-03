import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { FavoriteTargetType } from '../domain/favorite';

export class QueryFavoriteDto {
  @ApiPropertyOptional({ enum: FavoriteTargetType })
  @IsOptional()
  @IsEnum(FavoriteTargetType)
  targetType?: FavoriteTargetType;

  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsNumber()
  @IsOptional()
  limit?: number;
}

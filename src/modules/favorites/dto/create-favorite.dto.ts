import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { FavoriteTargetType } from '../domain/favorite';
import { sanitizeTransformer } from '../../../common/transformers/sanitize.transformer';

export class CreateFavoriteDto {
  @ApiProperty({ enum: FavoriteTargetType, description: 'Type of the item to favorite' })
  @IsNotEmpty()
  @IsEnum(FavoriteTargetType)
  targetType: FavoriteTargetType;

  @ApiProperty({ example: '123', type: String, description: 'ID of the item to favorite' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  targetId: string;

  @ApiPropertyOptional({ example: 'Product Name', type: String })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(sanitizeTransformer)
  title?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg', type: String })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  image?: string;

  @ApiPropertyOptional({ type: String, description: 'Additional data in JSON format' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  extra?: string;
}

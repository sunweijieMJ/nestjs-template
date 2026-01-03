import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { FavoriteTargetType } from '../domain/favorite';

export class CheckFavoriteDto {
  @ApiProperty({ enum: FavoriteTargetType })
  @IsNotEmpty()
  @IsEnum(FavoriteTargetType)
  targetType: FavoriteTargetType;

  @ApiProperty({ example: '123', type: String })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  targetId: string;
}

export class CheckFavoriteResponseDto {
  @ApiProperty({ type: Boolean })
  isFavorited: boolean;

  @ApiProperty({ type: String, required: false })
  favoriteId?: string | number;
}

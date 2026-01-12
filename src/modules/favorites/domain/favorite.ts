import { ApiProperty } from '@nestjs/swagger';

export enum FavoriteTargetType {
  PRODUCT = 'product',
  ARTICLE = 'article',
  STORE = 'store',
}

export class Favorite {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number, description: 'User ID who owns this favorite' })
  userId: number;

  @ApiProperty({ enum: FavoriteTargetType, description: 'Type of the favorited item' })
  targetType: FavoriteTargetType;

  @ApiProperty({ type: String, description: 'ID of the favorited item' })
  targetId: string;

  @ApiProperty({ type: String, description: 'Title/name of the favorited item', required: false })
  title?: string;

  @ApiProperty({ type: String, description: 'Image URL of the favorited item', required: false })
  image?: string;

  @ApiProperty({ type: String, description: 'Additional data in JSON format', required: false })
  extra?: string;

  @ApiProperty()
  createdAt: Date;
}

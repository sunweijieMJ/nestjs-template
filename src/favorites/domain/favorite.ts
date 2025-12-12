import { ApiProperty } from '@nestjs/swagger';
import databaseConfig from '../../database/config/database.config';
import { DatabaseConfig } from '../../database/config/database-config.type';

const idType = (databaseConfig() as DatabaseConfig).isDocumentDatabase ? String : Number;

export enum FavoriteTargetType {
  PRODUCT = 'product',
  ARTICLE = 'article',
  STORE = 'store',
}

export class Favorite {
  @ApiProperty({ type: idType })
  id: number | string;

  @ApiProperty({ type: idType, description: 'User ID who owns this favorite' })
  userId: number | string;

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

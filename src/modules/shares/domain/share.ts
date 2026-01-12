import { ApiProperty } from '@nestjs/swagger';

export enum ShareTargetType {
  PRODUCT = 'PRODUCT',
  ARTICLE = 'ARTICLE',
  PAGE = 'PAGE',
  STORE = 'STORE',
}

export enum SharePlatform {
  WECHAT = 'WECHAT',
  ALIPAY = 'ALIPAY',
  H5 = 'H5',
  APP = 'APP',
}

export class Share {
  @ApiProperty({
    type: Number,
  })
  id: number;

  @ApiProperty({
    type: Number,
    description: 'User ID who created this share',
  })
  userId: number;

  @ApiProperty({
    example: 'abc12345',
    type: String,
    description: 'Unique 8-character share code',
  })
  shareCode: string;

  @ApiProperty({
    enum: ShareTargetType,
    example: ShareTargetType.PRODUCT,
  })
  targetType: ShareTargetType;

  @ApiProperty({
    example: '123',
    type: String,
    description: 'ID of the target content',
  })
  targetId: string;

  @ApiProperty({
    enum: SharePlatform,
    example: SharePlatform.WECHAT,
  })
  platform: SharePlatform;

  @ApiProperty({
    example: 'Check out this amazing product!',
    type: String,
  })
  title: string;

  @ApiProperty({
    example: 'This is a great product with excellent features.',
    type: String,
    required: false,
  })
  description?: string;

  @ApiProperty({
    example: 'https://example.com/images/product.jpg',
    type: String,
    required: false,
  })
  image?: string;

  @ApiProperty({
    example: 'https://example.com/products/123',
    type: String,
  })
  url: string;

  @ApiProperty({
    type: Object,
    required: false,
    description: 'Additional metadata in JSON format',
  })
  metadata?: Record<string, unknown>;

  @ApiProperty({
    example: 0,
    type: Number,
    description: 'Number of times this share was viewed',
  })
  viewCount: number;

  @ApiProperty({
    example: 0,
    type: Number,
    description: 'Number of times this share was clicked',
  })
  clickCount: number;

  @ApiProperty({
    example: 0,
    type: Number,
    description: 'Number of conversions from this share',
  })
  conversionCount: number;

  @ApiProperty({
    required: false,
    description: 'Expiration timestamp for this share',
  })
  expiresAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt?: Date;
}

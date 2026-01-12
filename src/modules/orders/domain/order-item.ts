import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItem {
  @ApiProperty({ example: 1 })
  id: number | string;

  @ApiProperty({ example: 1 })
  orderId: number | string;

  @ApiProperty({ example: 'PROD001' })
  productId: string;

  @ApiProperty({ example: 'Premium Subscription' })
  productName: string;

  @ApiPropertyOptional({ example: 'https://example.com/product.jpg' })
  productImage?: string;

  @ApiProperty({ example: 9900, description: 'Unit price in cents' })
  unitPrice: number;

  @ApiProperty({ example: 1 })
  quantity: number;

  @ApiProperty({ example: 9900, description: 'Subtotal in cents' })
  subtotal: number;

  @ApiPropertyOptional({ type: Object })
  metadata?: Record<string, unknown>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

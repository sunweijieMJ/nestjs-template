import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsPositive, IsOptional, IsObject, MaxLength, IsUrl, Min } from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty({ example: 'PROD001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  productId: string;

  @ApiProperty({ example: 'Premium Subscription' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  productName: string;

  @ApiPropertyOptional({ example: 'https://example.com/product.jpg' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  productImage?: string;

  @ApiProperty({ example: 9900, description: 'Unit price in cents' })
  @IsInt()
  @IsPositive()
  unitPrice: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

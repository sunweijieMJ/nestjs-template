import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class AlipayConfigDto {
  @ApiProperty({
    example: 'Check out this amazing product!',
    description: 'Share title',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'This is a great product with excellent features.',
    description: 'Share description',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: 'https://example.com/images/product.jpg',
    description: 'Share image URL',
  })
  @IsUrl()
  @IsNotEmpty()
  image: string;

  @ApiProperty({
    example: '/pages/product/detail?id=123',
    description: 'Mini program page path',
  })
  @IsString()
  @IsNotEmpty()
  path: string;
}

export class AlipayShareConfigResponseDto {
  @ApiProperty({
    example: 'Check out this amazing product!',
  })
  title: string;

  @ApiProperty({
    example: 'This is a great product with excellent features.',
  })
  description: string;

  @ApiProperty({
    example: 'https://example.com/images/product.jpg',
  })
  image: string;

  @ApiProperty({
    example: '/pages/product/detail?id=123',
  })
  path: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class QqConfigDto {
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
    example: 'https://example.com/share/abc12345',
    description: 'Share URL',
  })
  @IsUrl()
  @IsNotEmpty()
  url: string;
}

export class QqShareConfigResponseDto {
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
    example: 'https://example.com/share/abc12345',
  })
  url: string;
}

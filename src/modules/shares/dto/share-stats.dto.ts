import { ApiProperty } from '@nestjs/swagger';

export class ShareStatsDto {
  @ApiProperty({
    example: 100,
    description: 'Number of times this share was viewed',
  })
  viewCount: number;

  @ApiProperty({
    example: 50,
    description: 'Number of times this share was clicked',
  })
  clickCount: number;

  @ApiProperty({
    example: 10,
    description: 'Number of conversions from this share',
  })
  conversionCount: number;

  @ApiProperty({
    example: 0.1,
    description: 'Conversion rate (conversionCount / viewCount)',
  })
  conversionRate: number;
}

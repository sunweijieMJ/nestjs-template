import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegionTreeDto {
  @ApiProperty({
    type: Number,
  })
  id: number;

  @ApiProperty({
    example: '110000000000',
    type: String,
    description: 'Administrative division code (12 digits)',
  })
  code: string;

  @ApiProperty({
    example: '北京市',
    type: String,
    description: 'Region name',
  })
  name: string;

  @ApiProperty({
    example: 1,
    type: Number,
    description: 'Level: 1-Province, 2-City, 3-District',
  })
  level: number;

  @ApiProperty({
    example: null,
    type: String,
    nullable: true,
    description: 'Parent region code',
  })
  parentCode: string | null;

  @ApiProperty({
    example: 0,
    type: Number,
    description: 'Sort order',
  })
  sort: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({
    type: () => [RegionTreeDto],
    description: 'Child regions',
  })
  children?: RegionTreeDto[];
}

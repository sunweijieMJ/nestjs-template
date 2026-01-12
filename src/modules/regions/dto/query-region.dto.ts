import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { IsRegionCode } from '../../../common/decorators/is-region-code.decorator';

export class QueryRegionDto {
  @ApiPropertyOptional({ example: 1, description: 'Level: 1-Province, 2-City, 3-District' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  @Type(() => Number)
  level?: number;

  @ApiPropertyOptional({ example: '110000000000', description: 'Parent region code' })
  @IsOptional()
  @IsRegionCode()
  parentCode?: string;

  @ApiPropertyOptional({ example: '北京', description: 'Search keyword' })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'keyword too long' })
  keyword?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, ValidateNested, IsInt, Min, IsIn, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Address } from '../domain/address';
import { IsRegionCode } from '../../../common/decorators/is-region-code.decorator';
import { jsonQueryTransformer, sortOrderTransformer } from '../../../common/transformers/json-query.transformer';

const SORTABLE_FIELDS: (keyof Address)[] = ['id', 'name', 'isDefault', 'createdAt', 'updatedAt'];

export class FilterAddressDto {
  @ApiPropertyOptional({ type: String, description: 'Filter by province name' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({ type: String, description: 'Filter by city name' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ type: String, description: 'Filter by province code (12 digits)' })
  @IsOptional()
  @IsRegionCode()
  provinceCode?: string;

  @ApiPropertyOptional({ type: String, description: 'Filter by city code (12 digits)' })
  @IsOptional()
  @IsRegionCode()
  cityCode?: string;

  @ApiPropertyOptional({ type: String, description: 'Filter by district code (12 digits)' })
  @IsOptional()
  @IsRegionCode()
  districtCode?: string;
}

export class SortAddressDto {
  @ApiPropertyOptional({ enum: SORTABLE_FIELDS })
  @IsIn(SORTABLE_FIELDS)
  orderBy: keyof Address;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'] })
  @Transform(sortOrderTransformer)
  @IsIn(['ASC', 'DESC'])
  order: 'ASC' | 'DESC';
}

export class QueryAddressDto {
  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @Transform(jsonQueryTransformer(FilterAddressDto))
  @ValidateNested()
  @Type(() => FilterAddressDto)
  filters?: FilterAddressDto | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @Transform(jsonQueryTransformer(SortAddressDto))
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SortAddressDto)
  sort?: SortAddressDto[] | null;
}

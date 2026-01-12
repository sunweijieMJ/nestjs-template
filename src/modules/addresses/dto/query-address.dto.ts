import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';
import { Address } from '../domain/address';
import { IsRegionCode } from '../../../common/decorators/is-region-code.decorator';

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
  @ApiPropertyOptional()
  @Type(() => String)
  @IsString()
  orderBy: keyof Address;

  @ApiPropertyOptional()
  @IsString()
  order: 'ASC' | 'DESC';
}

export class QueryAddressDto {
  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @Transform(({ value }) => (value ? plainToInstance(FilterAddressDto, JSON.parse(value)) : undefined))
  @ValidateNested()
  @Type(() => FilterAddressDto)
  filters?: FilterAddressDto | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @Transform(({ value }) => (value ? plainToInstance(SortAddressDto, JSON.parse(value)) : undefined))
  @ValidateNested({ each: true })
  @Type(() => SortAddressDto)
  sort?: SortAddressDto[] | null;
}

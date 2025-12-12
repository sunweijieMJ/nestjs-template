import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';
import { Address } from '../domain/address';

export class FilterAddressDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  city?: string;
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
  @Transform(({ value }) =>
    value ? plainToInstance(FilterAddressDto, JSON.parse(value)) : undefined,
  )
  @ValidateNested()
  @Type(() => FilterAddressDto)
  filters?: FilterAddressDto | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @Transform(({ value }) =>
    value ? plainToInstance(SortAddressDto, JSON.parse(value)) : undefined,
  )
  @ValidateNested({ each: true })
  @Type(() => SortAddressDto)
  sort?: SortAddressDto[] | null;
}

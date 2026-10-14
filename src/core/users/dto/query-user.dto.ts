import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { User } from '../domain/user';
import { RoleDto } from '../../../common/enums/roles/role.dto';
import { jsonQueryTransformer, sortOrderTransformer } from '../../../common/transformers/json-query.transformer';

const SORTABLE_FIELDS: (keyof User)[] = ['id', 'email', 'firstName', 'lastName', 'createdAt', 'updatedAt'];

export class FilterUserDto {
  @ApiPropertyOptional({ type: RoleDto })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RoleDto)
  roles?: RoleDto[] | null;
}

export class SortUserDto {
  @ApiProperty({ enum: SORTABLE_FIELDS })
  @IsIn(SORTABLE_FIELDS)
  orderBy: keyof User;

  @ApiProperty({ enum: ['ASC', 'DESC'] })
  @Transform(sortOrderTransformer)
  @IsIn(['ASC', 'DESC'])
  order: 'ASC' | 'DESC';
}

export class QueryUserDto {
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
  @Transform(jsonQueryTransformer(FilterUserDto))
  @ValidateNested()
  @Type(() => FilterUserDto)
  filters?: FilterUserDto | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @Transform(jsonQueryTransformer(SortUserDto))
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SortUserDto)
  sort?: SortUserDto[] | null;
}

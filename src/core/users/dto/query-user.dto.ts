import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsInt, IsOptional, Min, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { User } from '../domain/user';
import { RoleDto } from '../../../common/enums/roles/role.dto';
import { jsonQueryTransformer, sortOrderTransformer } from '../../../common/transformers/json-query.transformer';

/** 空字符串视为未传 */
const optionalNumberTransformer = ({ value }: { value: unknown }): unknown =>
  value === '' || value === undefined || value === null ? undefined : Number(value);

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
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Transform(optionalNumberTransformer)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, default: 10 })
  @IsOptional()
  @Transform(optionalNumberTransformer)
  @IsInt()
  @Min(1)
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

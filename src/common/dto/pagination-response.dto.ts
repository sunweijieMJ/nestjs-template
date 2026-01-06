import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard pagination response DTO
 */
export class PaginationResponseDto<T> {
  list: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Pagination metadata
 */
export class PaginationMeta {
  @ApiProperty({ example: 100, description: 'Total number of items' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ example: 10, description: 'Total number of pages' })
  totalPages: number;
}

/**
 * Factory function to create typed pagination response class for Swagger
 */
export function PaginationResponse<T>(classReference: Type<T>): abstract new () => PaginationResponseDto<T> {
  abstract class Pagination {
    @ApiProperty({ type: [classReference], description: 'List of items' })
    list!: T[];

    @ApiProperty({ example: 100, description: 'Total number of items' })
    total: number;

    @ApiProperty({ example: 1, description: 'Current page number' })
    page: number;

    @ApiProperty({ example: 10, description: 'Number of items per page' })
    limit: number;

    @ApiProperty({ example: 10, description: 'Total number of pages' })
    totalPages: number;
  }

  Object.defineProperty(Pagination, 'name', {
    writable: false,
    value: `Pagination${classReference.name}ResponseDto`,
  });

  return Pagination;
}

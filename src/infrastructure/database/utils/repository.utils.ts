import { IPaginationOptions } from '../../../common/types/pagination-options';

/**
 * Common sort option interface for repositories
 */
export interface SortOption {
  orderBy: string;
  order: 'ASC' | 'DESC';
}

/**
 * Build pagination parameters for TypeORM find operations
 */
export function buildPaginationParams(options: IPaginationOptions): { skip: number; take: number } {
  return {
    skip: (options.page - 1) * options.limit,
    take: options.limit,
  };
}

/**
 * Build order object for TypeORM find operations from sort options
 */
export function buildOrderParams<T extends SortOption>(
  sortOptions?: T[] | null,
  defaultOrder?: Record<string, 'ASC' | 'DESC'>,
): Record<string, 'ASC' | 'DESC'> {
  if (!sortOptions || sortOptions.length === 0) {
    return defaultOrder ?? {};
  }

  return sortOptions.reduce(
    (accumulator, sort) => ({
      ...accumulator,
      [sort.orderBy]: sort.order,
    }),
    defaultOrder ?? {},
  );
}

/**
 * Common find options builder for TypeORM repositories
 */
export function buildFindOptions<T extends SortOption>(params: {
  paginationOptions: IPaginationOptions;
  sortOptions?: T[] | null;
  defaultOrder?: Record<string, 'ASC' | 'DESC'>;
}): {
  skip: number;
  take: number;
  order: Record<string, 'ASC' | 'DESC'>;
} {
  return {
    ...buildPaginationParams(params.paginationOptions),
    order: buildOrderParams(params.sortOptions, params.defaultOrder),
  };
}

import { IPaginationOptions } from './types/pagination-options';
import { PaginationResponseDto } from './dto/pagination-response.dto';

/**
 * Create a standard pagination response
 */
export const pagination = <T>(data: T[], total: number, options: IPaginationOptions): PaginationResponseDto<T> => {
  const totalPages = Math.ceil(total / options.limit);

  return {
    list: data,
    total,
    page: options.page,
    limit: options.limit,
    totalPages,
  };
};

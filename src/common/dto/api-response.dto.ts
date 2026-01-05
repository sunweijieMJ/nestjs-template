import { ApiProperty } from '@nestjs/swagger';

/**
 * Unified API response wrapper
 * All successful responses will be wrapped in this format
 */
export class ApiResponse<T = unknown> {
  @ApiProperty({ example: 200, description: 'Business status code (200 = success)' })
  code: number;

  @ApiProperty({ example: 'success', description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Response data' })
  data: T;
}

/**
 * Error response format
 * All error responses will use this format
 */
export class ApiErrorResponse {
  @ApiProperty({ example: 400, description: 'HTTP status code' })
  code: number;

  @ApiProperty({ example: 'Bad Request', description: 'Error message' })
  message: string | string[];

  @ApiProperty({ description: 'Error data (can be null or an object with error details)' })
  data: Record<string, unknown> | null;
}

/**
 * Create a successful API response
 */
export function createApiResponse<T>(data: T, message = 'success'): ApiResponse<T> {
  return {
    code: 200,
    message,
    data,
  };
}

/**
 * Create an error API response
 */
export function createErrorResponse(
  code: number,
  message: string | string[],
  data: Record<string, unknown> | null = null,
): ApiErrorResponse {
  return {
    code,
    message,
    data,
  };
}

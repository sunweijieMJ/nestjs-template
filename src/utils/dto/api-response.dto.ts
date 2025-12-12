import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional({ example: 1702300000000, description: 'Unix timestamp in milliseconds' })
  timestamp?: number;
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

  @ApiPropertyOptional({ example: 'BadRequestException', description: 'Error type' })
  error?: string;

  @ApiPropertyOptional({ description: 'Detailed error information' })
  errors?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 1702300000000, description: 'Unix timestamp in milliseconds' })
  timestamp?: number;

  @ApiPropertyOptional({ example: '/v1/auth/login', description: 'Request path' })
  path?: string;

  @ApiPropertyOptional({ description: 'Request ID for tracing' })
  requestId?: string;
}

/**
 * Create a successful API response
 */
export function createApiResponse<T>(data: T, message = 'success'): ApiResponse<T> {
  return {
    code: 200,
    message,
    data,
    timestamp: Date.now(),
  };
}

/**
 * Create an error API response
 */
export function createErrorResponse(
  code: number,
  message: string | string[],
  options?: {
    error?: string;
    errors?: Record<string, unknown>;
    path?: string;
    requestId?: string;
  },
): ApiErrorResponse {
  return {
    code,
    message,
    error: options?.error,
    errors: options?.errors,
    timestamp: Date.now(),
    path: options?.path,
    requestId: options?.requestId,
  };
}

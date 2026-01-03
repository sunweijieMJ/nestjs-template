import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../dto/api-response.dto';
import { SKIP_RESPONSE_TRANSFORM_KEY } from '../decorators/skip-response-transform.decorator';

/**
 * Response interceptor that wraps all successful responses in a unified format
 *
 * Response format:
 * {
 *   code: 200,
 *   message: 'success',
 *   data: <original response>,
 *   timestamp: 1702300000000
 * }
 *
 * Use @SkipResponseTransform() decorator to skip transformation for specific endpoints
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | T> {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T> | T> {
    // Check if transformation should be skipped
    const skipTransform = this.reflector.getAllAndOverride<boolean>(SKIP_RESPONSE_TRANSFORM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipTransform) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        // If data is already in ApiResponse format, return as is
        if (this.isApiResponse(data)) {
          return data;
        }

        // Wrap data in unified response format
        return {
          code: 200,
          message: 'success',
          data,
          timestamp: Date.now(),
        };
      }),
    );
  }

  /**
   * Check if the response is already in ApiResponse format
   */
  private isApiResponse(data: unknown): data is ApiResponse<T> {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const response = data as Record<string, unknown>;
    return typeof response.code === 'number' && typeof response.message === 'string' && 'data' in response;
  }
}

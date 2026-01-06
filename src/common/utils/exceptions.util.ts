import { HttpStatus, UnprocessableEntityException, NotFoundException } from '@nestjs/common';

/**
 * Error response structure for validation errors
 */
export interface ValidationErrorResponse {
  status: number;
  errors: Record<string, string | Record<string, unknown>>;
}

/**
 * Throw a validation error with UnprocessableEntityException (422)
 * @param field - The field name that has the error
 * @param error - The error code/message
 */
export function throwValidationError(field: string, error: string): never {
  throw new UnprocessableEntityException({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    errors: { [field]: error },
  });
}

/**
 * Throw a validation error with multiple fields
 * @param errors - Object containing field names and their error codes
 */
export function throwValidationErrors(errors: Record<string, string>): never {
  throw new UnprocessableEntityException({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    errors,
  });
}

/**
 * Create an UnprocessableEntityException without throwing
 * Useful when you need to throw in a different context
 * @param field - The field name that has the error
 * @param error - The error code/message
 */
export function createValidationError(field: string, error: string): UnprocessableEntityException {
  return new UnprocessableEntityException({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    errors: { [field]: error },
  });
}

/**
 * Throw a not found error with NotFoundException (404)
 * @param error - The error code/message
 */
export function throwNotFoundError(error: string): never {
  throw new NotFoundException({
    status: HttpStatus.NOT_FOUND,
    error,
  });
}

/**
 * Create a NotFoundException without throwing
 * @param error - The error code/message
 */
export function createNotFoundError(error: string): NotFoundException {
  return new NotFoundException({
    status: HttpStatus.NOT_FOUND,
    error,
  });
}

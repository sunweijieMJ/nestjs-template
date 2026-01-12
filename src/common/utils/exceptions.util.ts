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

/**
 * PostgreSQL unique constraint violation error code
 */
const PG_UNIQUE_VIOLATION = '23505';

/**
 * Mapping of database column names to field names and error codes
 */
const UNIQUE_CONSTRAINT_MAP: Record<string, { field: string; error: string }> = {
  email: { field: 'email', error: 'emailAlreadyExists' },
  phone: { field: 'phone', error: 'phoneAlreadyExists' },
  wechatopenid: { field: 'wechatOpenId', error: 'wechatOpenIdAlreadyExists' },
};

/**
 * Check if an error is a unique constraint violation and throw appropriate validation error
 * @param error - The error to check
 * @throws UnprocessableEntityException if it's a unique constraint violation
 */
export function handleUniqueConstraintError(error: unknown): void {
  if (error && typeof error === 'object' && 'code' in error && error.code === PG_UNIQUE_VIOLATION) {
    const detail = 'detail' in error ? String(error.detail) : '';

    // Extract column name from PostgreSQL error detail
    // Format: "Key (column_name)=(value) already exists."
    const match = detail.match(/Key \((\w+)\)/i);
    if (match) {
      const columnName = match[1].toLowerCase();
      const mapping = UNIQUE_CONSTRAINT_MAP[columnName];
      if (mapping) {
        throwValidationError(mapping.field, mapping.error);
      }
    }

    // Default fallback for unknown unique constraint violations
    throwValidationError('unknown', 'uniqueConstraintViolation');
  }
}

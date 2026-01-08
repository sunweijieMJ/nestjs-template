import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Validator for MD5-encrypted passwords from frontend
 * MD5 hash is a 32-character hexadecimal string
 */
@ValidatorConstraint({ name: 'isMd5Password', async: false })
export class IsMd5PasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string): boolean {
    if (!password || typeof password !== 'string') {
      return false;
    }

    // MD5 hash is exactly 32 characters and contains only hexadecimal characters
    const md5Regex = /^[a-f0-9]{32}$/i;
    return md5Regex.test(password);
  }

  defaultMessage(): string {
    return 'Password must be a valid MD5 hash (32 hexadecimal characters)';
  }
}

/**
 * Decorator to validate MD5-encrypted password from frontend
 *
 * @example
 * ```typescript
 * export class LoginDto {
 *   @IsMd5Password()
 *   password: string;
 * }
 * ```
 */
export function IsMd5Password(validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName.toString(),
      options: validationOptions,
      constraints: [],
      validator: {
        validate(value: unknown) {
          if (!value || typeof value !== 'string') {
            return false;
          }

          // MD5 hash is exactly 32 characters and contains only hexadecimal characters
          const md5Regex = /^[a-f0-9]{32}$/i;
          return md5Regex.test(value);
        },
        defaultMessage() {
          return 'Password must be a valid MD5 hash (32 hexadecimal characters)';
        },
      },
    });
  };
}

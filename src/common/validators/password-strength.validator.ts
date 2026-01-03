import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Password strength requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (optional, configurable)
 */
export interface PasswordStrengthOptions {
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  minLength?: number;
}

const DEFAULT_OPTIONS: PasswordStrengthOptions = {
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false, // Optional by default
  minLength: 8,
};

@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  private options: PasswordStrengthOptions;
  private failedRequirements: string[] = [];

  constructor() {
    this.options = DEFAULT_OPTIONS;
  }

  validate(password: string): boolean {
    if (!password || typeof password !== 'string') {
      return false;
    }

    this.failedRequirements = [];
    const opts = this.options;

    if (password.length < (opts.minLength ?? 8)) {
      this.failedRequirements.push(`at least ${opts.minLength ?? 8} characters`);
    }

    if (opts.requireUppercase && !/[A-Z]/.test(password)) {
      this.failedRequirements.push('one uppercase letter');
    }

    if (opts.requireLowercase && !/[a-z]/.test(password)) {
      this.failedRequirements.push('one lowercase letter');
    }

    if (opts.requireNumbers && !/\d/.test(password)) {
      this.failedRequirements.push('one number');
    }

    if (opts.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      this.failedRequirements.push('one special character');
    }

    return this.failedRequirements.length === 0;
  }

  defaultMessage(): string {
    if (this.failedRequirements.length === 0) {
      return 'Password is too weak';
    }
    return `Password must contain ${this.failedRequirements.join(', ')}`;
  }
}

/**
 * Decorator to validate password strength
 *
 * @example
 * ```typescript
 * export class RegisterDto {
 *   @IsStrongPassword()
 *   password: string;
 * }
 * ```
 *
 * @example
 * With custom options:
 * ```typescript
 * export class RegisterDto {
 *   @IsStrongPassword({ requireSpecialChars: true, minLength: 10 })
 *   password: string;
 * }
 * ```
 */
export function IsStrongPassword(
  options?: PasswordStrengthOptions,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName.toString(),
      options: validationOptions,
      constraints: [options ?? DEFAULT_OPTIONS],
      validator: {
        validate(value: unknown, args) {
          if (!value || typeof value !== 'string') {
            return false;
          }

          const opts = (args?.constraints[0] as PasswordStrengthOptions) ?? DEFAULT_OPTIONS;
          const failures: string[] = [];

          if (value.length < (opts.minLength ?? 8)) {
            failures.push(`at least ${opts.minLength ?? 8} characters`);
          }

          if (opts.requireUppercase && !/[A-Z]/.test(value)) {
            failures.push('one uppercase letter');
          }

          if (opts.requireLowercase && !/[a-z]/.test(value)) {
            failures.push('one lowercase letter');
          }

          if (opts.requireNumbers && !/\d/.test(value)) {
            failures.push('one number');
          }

          if (opts.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
            failures.push('one special character');
          }

          return failures.length === 0;
        },
        defaultMessage(args) {
          const value = args?.value as string;
          const opts = (args?.constraints[0] as PasswordStrengthOptions) ?? DEFAULT_OPTIONS;
          const failures: string[] = [];

          if (!value || value.length < (opts.minLength ?? 8)) {
            failures.push(`at least ${opts.minLength ?? 8} characters`);
          }
          if (opts.requireUppercase && value && !/[A-Z]/.test(value)) {
            failures.push('one uppercase letter');
          }
          if (opts.requireLowercase && value && !/[a-z]/.test(value)) {
            failures.push('one lowercase letter');
          }
          if (opts.requireNumbers && value && !/\d/.test(value)) {
            failures.push('one number');
          }
          if (opts.requireSpecialChars && value && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
            failures.push('one special character');
          }

          return failures.length > 0 ? `Password must contain ${failures.join(', ')}` : 'Password is too weak';
        },
      },
    });
  };
}

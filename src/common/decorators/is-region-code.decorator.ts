import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/**
 * Validator decorator for 12-digit region codes
 * @param validationOptions Optional validation options
 */
export function IsRegionCode(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isRegionCode',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value === null || value === undefined) {
            return true; // Let @IsOptional handle this
          }
          return typeof value === 'string' && /^\d{12}$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a 12-digit region code`;
        },
      },
    });
  };
}

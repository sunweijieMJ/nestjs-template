import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ClassConstructor } from 'class-transformer/types/interfaces';

const BOOLEAN_STRINGS = ['true', 'false', ''];

function findInvalidBooleans<T extends object>(
  config: Record<string, unknown>,
  envVariablesClass: ClassConstructor<T>,
): string[] {
  return Object.keys(config).filter((key) => {
    const value = config[key];
    return (
      typeof value === 'string' &&
      Reflect.getMetadata('design:type', envVariablesClass.prototype, key) === Boolean &&
      !BOOLEAN_STRINGS.includes(value)
    );
  });
}

function validateConfig<T extends object>(config: Record<string, unknown>, envVariablesClass: ClassConstructor<T>): T {
  const invalidBooleans = findInvalidBooleans(config, envVariablesClass);
  if (invalidBooleans.length > 0) {
    throw new Error(`${invalidBooleans.join(', ')} must be "true" or "false"`);
  }

  const validatedConfig = plainToClass(envVariablesClass, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}

export default validateConfig;

import { registerAs } from '@nestjs/config';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { LoggerConfig } from './logger-config.type';
import validateConfig from '../../../common/validate-config';
import { Transform } from 'class-transformer';

enum LogLevel {
  Fatal = 'fatal',
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Debug = 'debug',
  Trace = 'trace',
  Silent = 'silent',
}

class EnvironmentVariablesValidator {
  @IsEnum(LogLevel)
  @IsOptional()
  LOG_LEVEL: LogLevel;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  LOG_PRETTY_PRINT: boolean;
}

export default registerAs<LoggerConfig>('logger', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  const isProduction = process.env.NODE_ENV === 'production';

  return {
    level: process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
    prettyPrint: process.env.LOG_PRETTY_PRINT !== undefined ? process.env.LOG_PRETTY_PRINT === 'true' : !isProduction,
  };
});

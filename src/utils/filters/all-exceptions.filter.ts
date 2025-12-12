import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { I18nContext } from 'nestjs-i18n';
import { ThrottlerException } from '@nestjs/throttler';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  errors?: Record<string, unknown>;
  timestamp: string;
  path: string;
  requestId?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const i18n = I18nContext.current(host);

    const requestId = request.headers['x-request-id'] as string | undefined;
    const path = httpAdapter.getRequestUrl(request);

    let statusCode: number;
    let message: string | string[];
    let error: string;
    let errors: Record<string, unknown> | undefined;

    if (exception instanceof ThrottlerException) {
      statusCode = HttpStatus.TOO_MANY_REQUESTS;
      message = i18n?.t('common.tooManyRequests') ?? 'Too many requests, please try again later';
      error = 'Too Many Requests';
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        message = response;
        error = exception.name;
      } else if (typeof response === 'object' && response !== null) {
        const responseObj = response as Record<string, unknown>;
        message = (responseObj.message as string | string[]) || exception.message;
        error = (responseObj.error as string) || exception.name;
        errors = responseObj.errors as Record<string, unknown> | undefined;
      } else {
        message = exception.message;
        error = exception.name;
      }
    } else if (exception instanceof Error) {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'Internal Server Error';

      // Log the full error for debugging (but don't expose to client)
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack, {
        path,
        requestId,
      });
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'Internal Server Error';

      this.logger.error(`Unknown exception type`, { exception, path, requestId });
    }

    const responseBody: ErrorResponse = {
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path,
    };

    if (errors) {
      responseBody.errors = errors;
    }

    if (requestId) {
      responseBody.requestId = requestId;
    }

    // Log non-500 errors at appropriate levels
    if (statusCode >= 500) {
      this.logger.error(`${error}: ${JSON.stringify(message)}`, { path, requestId, statusCode });
    } else if (statusCode >= 400) {
      this.logger.warn(`${error}: ${JSON.stringify(message)}`, { path, requestId, statusCode });
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, statusCode);
  }
}

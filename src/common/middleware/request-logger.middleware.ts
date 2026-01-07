import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Optional middleware for detailed request/response logging
 *
 * To enable this middleware, add it to your module:
 *
 * @example
 * ```typescript
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer
 *       .apply(RequestLoggerMiddleware)
 *       .forRoutes('*');
 *   }
 * }
 * ```
 *
 * Note: This middleware logs request body and response data.
 * Make sure sensitive data is already redacted by Pino logger.
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('RequestLogger');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, body, query, params } = req;
    const requestId = req.headers['x-request-id'] as string;

    // Log request details (only in debug mode)
    this.logger.debug({
      type: 'request',
      requestId,
      method,
      url: originalUrl,
      query,
      params,
      body,
    });

    // Capture response
    const originalSend = res.send;
    const logger = this.logger;

    res.send = function (data: unknown): Response {
      res.send = originalSend;

      // Log response details (only in debug mode)
      logger.debug({
        type: 'response',
        requestId,
        method,
        url: originalUrl,
        statusCode: res.statusCode,
        responseData: data,
      });

      return res.send(data);
    };

    next();
  }
}

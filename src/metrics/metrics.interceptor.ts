import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram, Gauge } from 'prom-client';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly httpRequestsTotal: Counter<string>,
    @InjectMetric('http_request_duration_seconds')
    private readonly httpRequestDuration: Histogram<string>,
    @InjectMetric('http_active_connections')
    private readonly activeConnections: Gauge<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const method = request.method;
    const path = this.normalizePath(request.route?.path ?? request.path);
    const startTime = Date.now();

    this.activeConnections.inc();

    return next.handle().pipe(
      tap({
        next: () => {
          this.recordMetrics(method, path, response.statusCode, startTime);
        },
        error: () => {
          this.recordMetrics(method, path, response.statusCode || 500, startTime);
        },
        finalize: () => {
          this.activeConnections.dec();
        },
      }),
    );
  }

  private recordMetrics(method: string, path: string, status: number, startTime: number): void {
    const duration = (Date.now() - startTime) / 1000;
    const statusCode = String(status);

    this.httpRequestsTotal.inc({ method, path, status: statusCode });
    this.httpRequestDuration.observe({ method, path, status: statusCode }, duration);
  }

  private normalizePath(path: string): string {
    // Replace dynamic path parameters with placeholders for consistent labeling
    return path
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9-]{36}/gi, '/:uuid')
      .replace(/\/[a-f0-9]{24}/gi, '/:objectId');
  }
}

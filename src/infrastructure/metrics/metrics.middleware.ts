import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram, Gauge } from '@prometheus-io/client';
import { NextFunction, Request, Response } from 'express';

/** 未匹配到路由的请求统一使用的 path 标签 */
export const UNMATCHED_ROUTE = '<unmatched>';

/** 客户端在响应完成前断开连接时使用的状态码 */
const CLIENT_CLOSED_REQUEST = 499;

/**
 * 在响应结束时记录请求指标，覆盖被 guard 拒绝和经异常过滤器处理的请求
 */
@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly httpRequestsTotal: Counter<string>,
    @InjectMetric('http_request_duration_seconds')
    private readonly httpRequestDuration: Histogram<string>,
    @InjectMetric('http_active_connections')
    private readonly activeConnections: Gauge<string>,
  ) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const startTime = Date.now();
    let recorded = false;
    this.activeConnections.inc();

    const record = (): void => {
      if (recorded) {
        return;
      }
      recorded = true;
      this.activeConnections.dec();

      const labels = {
        method: request.method,
        path: this.routeLabel(request),
        status: String(response.writableFinished ? response.statusCode : CLIENT_CLOSED_REQUEST),
      };
      this.httpRequestsTotal.inc(labels);
      this.httpRequestDuration.observe(labels, (Date.now() - startTime) / 1000);
    };

    response.on('finish', record);
    response.on('close', record);
    next();
  }

  private routeLabel(request: Request): string {
    const routePath = (request.route as { path?: unknown } | undefined)?.path;
    return typeof routePath === 'string' ? `${request.baseUrl}${routePath}` : UNMATCHED_ROUTE;
  }
}

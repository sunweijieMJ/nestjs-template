import { EventEmitter } from 'events';
import { Counter, Gauge, Histogram } from '@prometheus-io/client';
import { Request, Response } from 'express';
import { MetricsMiddleware, UNMATCHED_ROUTE } from './metrics.middleware';

function createResponse(statusCode: number, writableFinished: boolean): Response & EventEmitter {
  return Object.assign(new EventEmitter(), { statusCode, writableFinished }) as unknown as Response & EventEmitter;
}

describe('MetricsMiddleware', () => {
  let counter: { inc: ReturnType<typeof vi.fn> };
  let histogram: { observe: ReturnType<typeof vi.fn> };
  let gauge: { inc: ReturnType<typeof vi.fn>; dec: ReturnType<typeof vi.fn> };
  let middleware: MetricsMiddleware;

  beforeEach(() => {
    counter = { inc: vi.fn() };
    histogram = { observe: vi.fn() };
    gauge = { inc: vi.fn(), dec: vi.fn() };
    middleware = new MetricsMiddleware(
      counter as unknown as Counter<string>,
      histogram as unknown as Histogram<string>,
      gauge as unknown as Gauge<string>,
    );
  });

  it('should record the final status code with the route template', () => {
    const request = { method: 'GET', baseUrl: '', route: { path: '/api/v1/orders/:id' } } as unknown as Request;
    const response = createResponse(404, true);
    const next = vi.fn();

    middleware.use(request, response, next);
    response.emit('finish');
    response.emit('close');

    expect(next).toHaveBeenCalled();
    expect(counter.inc).toHaveBeenCalledTimes(1);
    expect(counter.inc).toHaveBeenCalledWith({ method: 'GET', path: '/api/v1/orders/:id', status: '404' });
    expect(gauge.dec).toHaveBeenCalledTimes(1);
  });

  it('should use a fixed label for requests without a matched route', () => {
    const request = { method: 'GET', baseUrl: '', path: '/random/12345' } as unknown as Request;
    const response = createResponse(404, true);

    middleware.use(request, response, vi.fn());
    response.emit('finish');

    expect(counter.inc).toHaveBeenCalledWith({ method: 'GET', path: UNMATCHED_ROUTE, status: '404' });
  });

  it('should record 499 when the client closes before the response finishes', () => {
    const request = { method: 'POST', baseUrl: '', route: { path: '/api/v1/orders' } } as unknown as Request;
    const response = createResponse(200, false);

    middleware.use(request, response, vi.fn());
    response.emit('close');

    expect(counter.inc).toHaveBeenCalledWith({ method: 'POST', path: '/api/v1/orders', status: '499' });
  });
});

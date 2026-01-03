import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  PrometheusModule,
  makeCounterProvider,
  makeHistogramProvider,
  makeGaugeProvider,
} from '@willsoto/nestjs-prometheus';
import { AllConfigType } from '../../config/config.type';
import { MetricsInterceptor } from './metrics.interceptor';

// Custom metrics providers
const httpRequestsTotal = makeCounterProvider({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
});

const httpRequestDuration = makeHistogramProvider({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

const activeConnections = makeGaugeProvider({
  name: 'http_active_connections',
  help: 'Number of active HTTP connections',
});

const databaseQueryDuration = makeHistogramProvider({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
});

const cacheHitsTotal = makeCounterProvider({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_name'],
});

const cacheMissesTotal = makeCounterProvider({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_name'],
});

const queueJobsTotal = makeCounterProvider({
  name: 'queue_jobs_total',
  help: 'Total number of queue jobs',
  labelNames: ['queue_name', 'status'],
});

@Module({})
export class MetricsModule {
  static forRoot(): DynamicModule {
    return {
      module: MetricsModule,
      imports: [
        PrometheusModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService<AllConfigType>) => {
            const enabled = configService.get('metrics.enabled', { infer: true });
            const path = configService.get('metrics.path', { infer: true }) ?? 'metrics';
            const defaultLabels = configService.get('metrics.defaultLabels', { infer: true }) ?? {};

            return {
              path: `/${path}`,
              defaultMetrics: {
                enabled: enabled ?? true,
              },
              defaultLabels,
            };
          },
        }),
      ],
      providers: [
        httpRequestsTotal,
        httpRequestDuration,
        activeConnections,
        databaseQueryDuration,
        cacheHitsTotal,
        cacheMissesTotal,
        queueJobsTotal,
        MetricsInterceptor,
      ],
      exports: [
        httpRequestsTotal,
        httpRequestDuration,
        activeConnections,
        databaseQueryDuration,
        cacheHitsTotal,
        cacheMissesTotal,
        queueJobsTotal,
        MetricsInterceptor,
      ],
    };
  }
}

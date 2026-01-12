import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  HealthIndicatorFunction,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';
import { RedisHealthIndicator } from './indicators/redis.health';
import { WechatApiHealthIndicator } from './indicators/wechat-api.health';
import { AlipayApiHealthIndicator } from './indicators/alipay-api.health';
import { DatabasePoolHealthIndicator } from './indicators/database-pool.health';

@ApiTags('Health')
@Controller({
  path: 'health',
  version: '1',
})
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private typeOrmHealthIndicator: TypeOrmHealthIndicator,
    private memoryHealthIndicator: MemoryHealthIndicator,
    private diskHealthIndicator: DiskHealthIndicator,
    private redisHealthIndicator: RedisHealthIndicator,
    private wechatApiHealthIndicator: WechatApiHealthIndicator,
    private alipayApiHealthIndicator: AlipayApiHealthIndicator,
    private databasePoolHealthIndicator: DatabasePoolHealthIndicator,
    private configService: ConfigService<AllConfigType>,
  ) {}

  @Get()
  @ApiOperation({ operationId: 'healthCheck', summary: '健康检查' })
  @HealthCheck()
  async check(): Promise<import('@nestjs/terminus').HealthCheckResult> {
    const redisEnabled = this.configService.get('redis.enabled', { infer: true });

    const checks: HealthIndicatorFunction[] = [
      // Memory check - heap should not exceed 300MB
      () => this.memoryHealthIndicator.checkHeap('memory_heap', 300 * 1024 * 1024),
      // Disk check - storage should not exceed 90%
      () =>
        this.diskHealthIndicator.checkStorage('disk', {
          path: '/',
          thresholdPercent: 0.9,
        }),
      // Database check
      () => this.typeOrmHealthIndicator.pingCheck('database'),
      // Database connection pool check
      () => this.databasePoolHealthIndicator.isHealthy('database_pool'),
    ];

    // Redis check if enabled
    if (redisEnabled) {
      checks.push(() => this.redisHealthIndicator.isHealthy('redis'));
    }

    // External API health checks
    checks.push(() => this.wechatApiHealthIndicator.isHealthy('wechat_api'));
    checks.push(() => this.alipayApiHealthIndicator.isHealthy('alipay_api'));

    return this.health.check(checks);
  }

  @Get('live')
  @ApiOperation({ operationId: 'livenessProbe', summary: '存活探针（Kubernetes）' })
  @HealthCheck()
  liveness(): Promise<import('@nestjs/terminus').HealthCheckResult> {
    return this.health.check([() => this.memoryHealthIndicator.checkHeap('memory_heap', 300 * 1024 * 1024)]);
  }

  @Get('ready')
  @ApiOperation({ operationId: 'readinessProbe', summary: '就绪探针（Kubernetes）' })
  @HealthCheck()
  async readiness(): Promise<import('@nestjs/terminus').HealthCheckResult> {
    return this.health.check([() => this.typeOrmHealthIndicator.pingCheck('database')]);
  }
}

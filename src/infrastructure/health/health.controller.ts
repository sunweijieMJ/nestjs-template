import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MongooseHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  HealthIndicatorFunction,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';
import { RedisHealthIndicator } from './indicators/redis.health';
import databaseConfig from '../database/config/database.config';
import { DatabaseConfig } from '../database/config/database-config.type';

@ApiTags('Health')
@Controller({
  path: 'health',
  version: '1',
})
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private typeOrmHealthIndicator: TypeOrmHealthIndicator,
    private mongooseHealthIndicator: MongooseHealthIndicator,
    private memoryHealthIndicator: MemoryHealthIndicator,
    private diskHealthIndicator: DiskHealthIndicator,
    private redisHealthIndicator: RedisHealthIndicator,
    private configService: ConfigService<AllConfigType>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @HealthCheck()
  async check(): Promise<import('@nestjs/terminus').HealthCheckResult> {
    const isDocumentDatabase = (databaseConfig() as DatabaseConfig).isDocumentDatabase;
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
    ];

    // Database check based on type
    if (isDocumentDatabase) {
      checks.push(() => this.mongooseHealthIndicator.pingCheck('database'));
    } else {
      checks.push(() => this.typeOrmHealthIndicator.pingCheck('database'));
    }

    // Redis check if enabled
    if (redisEnabled) {
      checks.push(() => this.redisHealthIndicator.isHealthy('redis'));
    }

    return this.health.check(checks);
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe for Kubernetes' })
  @HealthCheck()
  liveness(): Promise<import('@nestjs/terminus').HealthCheckResult> {
    return this.health.check([() => this.memoryHealthIndicator.checkHeap('memory_heap', 300 * 1024 * 1024)]);
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe for Kubernetes' })
  @HealthCheck()
  async readiness(): Promise<import('@nestjs/terminus').HealthCheckResult> {
    const isDocumentDatabase = (databaseConfig() as DatabaseConfig).isDocumentDatabase;

    const checks: HealthIndicatorFunction[] = [];

    if (isDocumentDatabase) {
      checks.push(() => this.mongooseHealthIndicator.pingCheck('database'));
    } else {
      checks.push(() => this.typeOrmHealthIndicator.pingCheck('database'));
    }

    return this.health.check(checks);
  }
}

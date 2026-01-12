import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

interface PoolStats {
  activeConnections: number;
  maxConnections: number;
  utilizationPercent: number;
}

@Injectable()
export class DatabasePoolHealthIndicator extends HealthIndicator {
  private readonly UTILIZATION_THRESHOLD = 90; // Mark unhealthy if utilization > 90%

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Query PostgreSQL connection pool statistics
      const result = await this.dataSource.query(`
        SELECT
          numbackends as active_connections,
          (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
        FROM pg_stat_database
        WHERE datname = current_database()
      `);

      if (!result || result.length === 0) {
        throw new Error('Unable to retrieve database pool statistics');
      }

      const { active_connections, max_connections } = result[0];
      const activeConnections = parseInt(active_connections, 10);
      const maxConnections = parseInt(max_connections, 10);
      const utilizationPercent = Math.round((activeConnections / maxConnections) * 100);

      const poolStats: PoolStats = {
        activeConnections,
        maxConnections,
        utilizationPercent,
      };

      if (utilizationPercent > this.UTILIZATION_THRESHOLD) {
        throw new HealthCheckError('Database pool utilization too high', this.getStatus(key, false, poolStats));
      }

      return this.getStatus(key, true, poolStats);
    } catch (error) {
      if (error instanceof HealthCheckError) {
        throw error;
      }

      throw new HealthCheckError(
        'Database pool health check failed',
        this.getStatus(key, false, {
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }
}

import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

interface PoolStats {
  activeConnections: number;
  maxConnections: number;
  utilizationPercent: number;
}

@Injectable()
export class DatabasePoolHealthIndicator {
  private readonly UTILIZATION_THRESHOLD = 90; // Mark unhealthy if utilization > 90%

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    private healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

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
        return indicator.down({ ...poolStats });
      }

      return indicator.up({ ...poolStats });
    } catch (error) {
      return indicator.down({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}

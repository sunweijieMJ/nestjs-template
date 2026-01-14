import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../../config/config.type';

@Injectable()
export class QqApiHealthIndicator extends HealthIndicator {
  private readonly QQ_API_URL = 'https://graph.qq.com/oauth2.0/me';
  private readonly TIMEOUT = 5000;

  constructor(private configService: ConfigService<AllConfigType>) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const appId = this.configService.get('qq.appId', { infer: true });
    const appKey = this.configService.get('qq.appKey', { infer: true });

    // Skip if QQ is not configured
    if (!appId || !appKey) {
      return this.getStatus(key, true, { message: 'QQ not configured, skipped' });
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

      const response = await fetch(this.QQ_API_URL, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // QQ API returns 200 even without valid token, which means the API is reachable
      if (response.ok || response.status === 400) {
        return this.getStatus(key, true, { responseTime: 'OK' });
      }

      throw new HealthCheckError(
        'QQ API returned non-OK status',
        this.getStatus(key, false, { statusCode: response.status }),
      );
    } catch (error) {
      if (error instanceof HealthCheckError) {
        throw error;
      }

      throw new HealthCheckError(
        'QQ API health check failed',
        this.getStatus(key, false, {
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }
}

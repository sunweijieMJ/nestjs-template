import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../../config/config.type';

@Injectable()
export class AlipayApiHealthIndicator extends HealthIndicator {
  private readonly ALIPAY_GATEWAY_URL = 'https://openapi.alipay.com/gateway.do';
  private readonly TIMEOUT = 5000;

  constructor(private configService: ConfigService<AllConfigType>) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const appId = this.configService.get('alipay.appId', { infer: true });

    // Skip if Alipay is not configured
    if (!appId) {
      return this.getStatus(key, true, { message: 'Alipay not configured, skipped' });
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

      const response = await fetch(this.ALIPAY_GATEWAY_URL, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Alipay gateway returns 200 even for HEAD requests
      if (response.ok || response.status === 405) {
        // 405 Method Not Allowed is also acceptable - means server is reachable
        return this.getStatus(key, true, { responseTime: 'OK' });
      }

      throw new HealthCheckError(
        'Alipay API returned non-OK status',
        this.getStatus(key, false, { statusCode: response.status }),
      );
    } catch (error) {
      if (error instanceof HealthCheckError) {
        throw error;
      }

      throw new HealthCheckError(
        'Alipay API health check failed',
        this.getStatus(key, false, {
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }
}

import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../../config/config.type';

@Injectable()
export class AlipayApiHealthIndicator {
  private readonly ALIPAY_GATEWAY_URL = 'https://openapi.alipay.com/gateway.do';
  private readonly TIMEOUT = 5000;

  constructor(
    private configService: ConfigService<AllConfigType>,
    private healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const appId = this.configService.get('alipay.appId', { infer: true });

    // Skip if Alipay is not configured
    if (!appId) {
      return indicator.up({ message: 'Alipay not configured, skipped' });
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
        return indicator.up({ responseTime: 'OK' });
      }

      return indicator.down({ statusCode: response.status });
    } catch (error) {
      return indicator.down({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}

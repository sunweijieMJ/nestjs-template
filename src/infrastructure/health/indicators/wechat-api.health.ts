import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../../config/config.type';

@Injectable()
export class WechatApiHealthIndicator {
  private readonly WECHAT_API_URL = 'https://api.weixin.qq.com/cgi-bin/getcallbackip';
  private readonly TIMEOUT = 5000;

  constructor(
    private configService: ConfigService<AllConfigType>,
    private healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const appId = this.configService.get('wechat.appId', { infer: true });
    const appSecret = this.configService.get('wechat.appSecret', { infer: true });

    // Skip if WeChat is not configured
    if (!appId || !appSecret) {
      return indicator.up({ message: 'WeChat not configured, skipped' });
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

      const response = await fetch(this.WECHAT_API_URL, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return indicator.up({ responseTime: 'OK' });
      }

      return indicator.down({ statusCode: response.status });
    } catch (error) {
      return indicator.down({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}

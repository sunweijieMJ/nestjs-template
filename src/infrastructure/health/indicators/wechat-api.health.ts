import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../../config/config.type';

@Injectable()
export class WechatApiHealthIndicator extends HealthIndicator {
  private readonly WECHAT_API_URL = 'https://api.weixin.qq.com/cgi-bin/getcallbackip';
  private readonly TIMEOUT = 5000;

  constructor(private configService: ConfigService<AllConfigType>) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const appId = this.configService.get('wechat.appId', { infer: true });
    const appSecret = this.configService.get('wechat.appSecret', { infer: true });

    // Skip if WeChat is not configured
    if (!appId || !appSecret) {
      return this.getStatus(key, true, { message: 'WeChat not configured, skipped' });
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
        return this.getStatus(key, true, { responseTime: 'OK' });
      }

      throw new HealthCheckError(
        'WeChat API returned non-OK status',
        this.getStatus(key, false, { statusCode: response.status }),
      );
    } catch (error) {
      if (error instanceof HealthCheckError) {
        throw error;
      }

      throw new HealthCheckError(
        'WeChat API health check failed',
        this.getStatus(key, false, {
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }
}

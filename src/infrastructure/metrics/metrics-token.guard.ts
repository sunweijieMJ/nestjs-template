import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { Request } from 'express';
import { AllConfigType } from '../../config/config.type';

/** 配置了 METRICS_TOKEN 时要求 Bearer 令牌匹配；未配置时仅非生产环境放行 */
@Injectable()
export class MetricsTokenGuard implements CanActivate {
  constructor(private readonly configService: ConfigService<AllConfigType>) {}

  canActivate(context: ExecutionContext): boolean {
    const token = this.configService.get('metrics.token', { infer: true });
    if (!token) {
      return this.configService.get('app.nodeEnv', { infer: true }) !== 'production';
    }

    const [scheme, credentials = ''] = (context.switchToHttp().getRequest<Request>().headers.authorization ?? '')
      .trim()
      .split(/\s+/, 2);
    const expected = Buffer.from(token);
    const actual = Buffer.from(credentials);
    return scheme?.toLowerCase() === 'bearer' && actual.length === expected.length && timingSafeEqual(actual, expected);
  }
}

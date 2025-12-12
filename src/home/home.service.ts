import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../config/config.type';

@Injectable()
export class HomeService {
  private readonly startTime = Date.now();

  constructor(private configService: ConfigService<AllConfigType>) {}

  appInfo(): { name: string | undefined } {
    return { name: this.configService.get('app.name', { infer: true }) };
  }

  healthCheck(): {
    status: string;
    timestamp: string;
    uptime: number;
    memory: { heapUsed: number; heapTotal: number; rss: number };
    node: string;
  } {
    const memoryUsage = process.memoryUsage();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
      },
      node: process.version,
    };
  }
}

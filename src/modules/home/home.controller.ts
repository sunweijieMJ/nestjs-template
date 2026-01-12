import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { HomeService } from './home.service';

@ApiTags('Home')
@Controller()
export class HomeController {
  constructor(private service: HomeService) {}

  @Get()
  @ApiOperation({ operationId: 'getAppInfo', summary: '获取应用信息' })
  appInfo(): { name: string | undefined } {
    return this.service.appInfo();
  }

  @Get('health')
  @ApiOperation({ operationId: 'simpleHealthCheck', summary: '简单健康检查' })
  @ApiOkResponse({
    description: '健康检查响应',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2025-01-01T00:00:00.000Z' },
        uptime: { type: 'number', example: 3600 },
        memory: {
          type: 'object',
          properties: {
            heapUsed: { type: 'number', example: 50 },
            heapTotal: { type: 'number', example: 100 },
            rss: { type: 'number', example: 150 },
          },
        },
        node: { type: 'string', example: 'v20.0.0' },
      },
    },
  })
  healthCheck(): ReturnType<HomeService['healthCheck']> {
    return this.service.healthCheck();
  }
}

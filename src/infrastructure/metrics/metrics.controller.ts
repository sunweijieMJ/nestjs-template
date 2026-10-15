import { Get, Res, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
import type { Response } from 'express';
import { MonitoringTokenGuard } from '../../common/guards/monitoring-token.guard';
import { SkipResponseTransform } from '../../common/decorators/skip-response-transform.decorator';

/** 路由路径继承自 PrometheusController，由 PrometheusModule 按 METRICS_PATH 设置 */
@ApiExcludeController()
@UseGuards(MonitoringTokenGuard)
export class MetricsController extends PrometheusController {
  @Get()
  @SkipResponseTransform()
  override index(@Res({ passthrough: true }) response: Response): Promise<string> {
    return super.index(response);
  }
}

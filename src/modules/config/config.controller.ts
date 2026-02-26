import { Body, Controller, Get, HttpCode, HttpStatus, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AppConfigService } from './config.service';
import { UpsertConfigDto } from './dto/upsert-config.dto';
import { Config } from './domain/config';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Config')
@Controller({
  path: 'config',
  version: '1',
})
export class AppConfigController {
  constructor(private readonly appConfigService: AppConfigService) {}

  @ApiOperation({ operationId: 'getConfig', summary: '获取配置' })
  @ApiOkResponse({ type: Config })
  @ApiParam({ name: 'key', type: String, example: 'app.theme' })
  @Get(':key')
  @HttpCode(HttpStatus.OK)
  findByKey(@Param('key') key: string): Promise<Config> {
    return this.appConfigService.findByKey(key);
  }

  @ApiOperation({ operationId: 'upsertConfig', summary: '写入配置' })
  @ApiOkResponse({ type: Config })
  @ApiParam({ name: 'key', type: String, example: 'app.theme' })
  @Put(':key')
  @HttpCode(HttpStatus.OK)
  upsert(@Param('key') key: string, @Body() dto: UpsertConfigDto): Promise<Config> {
    return this.appConfigService.upsert(key, dto.value);
  }
}

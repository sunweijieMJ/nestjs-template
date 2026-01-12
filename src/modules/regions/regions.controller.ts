import { Controller, Get, Query, Param, HttpStatus, HttpCode, NotFoundException } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RegionsService, RegionTree } from './regions.service';
import { Region } from './domain/region';
import { QueryRegionDto } from './dto/query-region.dto';
import { ProvinceCodeParam, CityCodeParam, RegionCodeParam } from './dto/region-code.param';

@ApiTags('Regions')
@Controller({
  path: 'regions',
  version: '1',
})
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @ApiOkResponse({ type: [Region] })
  @ApiOperation({
    operationId: 'getProvinces',
    summary: '获取所有省份',
  })
  @Get('provinces')
  @HttpCode(HttpStatus.OK)
  getProvinces(): Promise<Region[]> {
    return this.regionsService.getProvinces();
  }

  @ApiOkResponse({ type: [Region] })
  @ApiOperation({
    operationId: 'getCities',
    summary: '获取指定省份下的城市',
  })
  @Get('cities/:provinceCode')
  @HttpCode(HttpStatus.OK)
  getCities(@Param() params: ProvinceCodeParam): Promise<Region[]> {
    return this.regionsService.getCitiesByProvinceCode(params.provinceCode);
  }

  @ApiOkResponse({ type: [Region] })
  @ApiOperation({
    operationId: 'getDistricts',
    summary: '获取指定城市下的区县',
  })
  @Get('districts/:cityCode')
  @HttpCode(HttpStatus.OK)
  getDistricts(@Param() params: CityCodeParam): Promise<Region[]> {
    return this.regionsService.getDistrictsByCityCode(params.cityCode);
  }

  @ApiOkResponse({ type: Region })
  @ApiOperation({
    operationId: 'getRegionByCode',
    summary: '根据 code 获取地区详情',
  })
  @Get('code/:code')
  @HttpCode(HttpStatus.OK)
  async getByCode(@Param() params: RegionCodeParam): Promise<Region> {
    const region = await this.regionsService.getByCode(params.code);
    if (!region) {
      throw new NotFoundException({
        error: 'regionNotFound',
        message: `Region with code ${params.code} not found`,
      });
    }
    return region;
  }

  @ApiOkResponse({
    type: 'object',
    description: 'Region tree structure',
  })
  @ApiOperation({
    operationId: 'getRegionTree',
    summary: '获取完整的省市区树形结构',
  })
  @Get('tree')
  @HttpCode(HttpStatus.OK)
  getTree(): Promise<RegionTree[]> {
    return this.regionsService.getTree();
  }

  @ApiOkResponse({ type: [Region] })
  @ApiOperation({
    operationId: 'queryRegions',
    summary: '查询地区（支持按级别、父级代码、关键词搜索）',
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  query(@Query() queryDto: QueryRegionDto): Promise<Region[]> {
    return this.regionsService.query(queryDto);
  }
}

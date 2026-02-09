import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
  Request,
  Ip,
  Headers,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SharesService } from './shares.service';
import { CreateShareDto } from './dto/create-share.dto';
import { QueryShareDto } from './dto/query-share.dto';
import { WeChatConfigDto, WeChatJsSdkConfigResponseDto } from './dto/wechat-config.dto';
import { AlipayConfigDto, AlipayShareConfigResponseDto } from './dto/alipay-config.dto';
import { TrackShareDto } from './dto/track-share.dto';
import { ShareStatsDto } from './dto/share-stats.dto';
import { Share } from './domain/share';
import { PaginationResponse, PaginationResponseDto } from '../../common/dto/pagination-response.dto';
import { pagination } from '../../common/pagination';
import { RequestWithUser } from '../../common/types/request-with-user.type';
import { WechatService } from '../../integrations/wechat/wechat.service';
import { AlipayService } from '../../integrations/alipay/alipay.service';

@ApiTags('Shares')
@Controller({
  path: 'shares',
  version: '1',
})
export class SharesController {
  constructor(
    private readonly sharesService: SharesService,
    private readonly wechatService: WechatService,
    private readonly alipayService: AlipayService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOkResponse({ type: Share })
  @ApiOperation({ operationId: 'createShare', summary: '创建分享' })
  @Post()
  @HttpCode(HttpStatus.OK)
  async create(@Request() request: RequestWithUser, @Body() createShareDto: CreateShareDto): Promise<Share> {
    return this.sharesService.create(request.user.id, createShareDto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOkResponse({ type: PaginationResponse(Share) })
  @ApiOperation({ operationId: 'getShares', summary: '获取分享列表' })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Request() request: RequestWithUser,
    @Query() query: QueryShareDto,
  ): Promise<PaginationResponseDto<Share>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    const data = await this.sharesService.findManyWithPagination(request.user.id, query, { page, limit });
    const total = await this.sharesService.count(request.user.id, query);

    return pagination(data, total, { page, limit });
  }

  @ApiOkResponse({ type: Share })
  @ApiOperation({ operationId: 'getShareByCode', summary: '通过分享码获取内容' })
  @ApiParam({ name: 'code', type: String })
  @Get('code/:code')
  @HttpCode(HttpStatus.OK)
  async findByCode(
    @Param('code') code: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<Share> {
    return this.sharesService.findByShareCode(code, ip, userAgent);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOkResponse({ type: Share })
  @ApiOperation({ operationId: 'getShareById', summary: '获取分享详情' })
  @ApiParam({ name: 'id', type: Number })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Request() request: RequestWithUser, @Param('id', ParseIntPipe) id: number): Promise<Share> {
    return this.sharesService.findOne(id, request.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ operationId: 'deleteShare', summary: '删除分享' })
  @ApiParam({ name: 'id', type: Number })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Request() request: RequestWithUser, @Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.sharesService.remove(id, request.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOkResponse({ type: ShareStatsDto })
  @ApiOperation({ operationId: 'getShareStats', summary: '获取分享统计' })
  @ApiParam({ name: 'id', type: Number })
  @Get(':id/stats')
  @HttpCode(HttpStatus.OK)
  async getStats(@Request() request: RequestWithUser, @Param('id', ParseIntPipe) id: number): Promise<ShareStatsDto> {
    return this.sharesService.getStats(id, request.user.id);
  }

  @ApiOperation({ operationId: 'trackShare', summary: '追踪分享行为' })
  @ApiParam({ name: 'id', type: Number })
  @Post(':id/track')
  @HttpCode(HttpStatus.OK)
  async track(
    @Param('id', ParseIntPipe) id: number,
    @Body() trackShareDto: TrackShareDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<void> {
    return this.sharesService.trackShare(id, trackShareDto.action, ip, userAgent, trackShareDto.metadata);
  }

  @ApiOkResponse({ type: WeChatJsSdkConfigResponseDto })
  @ApiOperation({ operationId: 'getWeChatConfig', summary: '获取微信JS-SDK配置' })
  @Post('wechat/config')
  @HttpCode(HttpStatus.OK)
  async getWeChatConfig(@Body() wechatConfigDto: WeChatConfigDto): Promise<WeChatJsSdkConfigResponseDto> {
    return this.wechatService.getJsSdkConfig(wechatConfigDto.url);
  }

  @ApiOkResponse({ type: AlipayShareConfigResponseDto })
  @ApiOperation({ operationId: 'getAlipayConfig', summary: '获取支付宝分享配置' })
  @Post('alipay/config')
  @HttpCode(HttpStatus.OK)
  getAlipayConfig(@Body() alipayConfigDto: AlipayConfigDto): AlipayShareConfigResponseDto {
    return this.alipayService.getShareConfig(alipayConfigDto);
  }
}

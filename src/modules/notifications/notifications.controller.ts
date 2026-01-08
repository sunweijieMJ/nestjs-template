import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { Notification } from './domain/notification';
import { NotificationSetting } from './domain/notification-setting';
import { PaginationResponse, PaginationResponseDto } from '../../common/dto/pagination-response.dto';
import { pagination } from '../../common/pagination';
import { RequestWithUser } from '../../common/types/request-with-user.type';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Notifications')
@Controller({
  path: 'notifications',
  version: '1',
})
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOkResponse({
    type: PaginationResponse(Notification),
  })
  @ApiOperation({ operationId: 'getNotifications', summary: '获取通知列表' })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Request() request: RequestWithUser,
    @Query() query: QueryNotificationDto,
  ): Promise<PaginationResponseDto<Notification>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    const { data, total } = await this.notificationsService.findManyWithPaginationAndCount({
      userId: request.user.id,
      filterOptions: query,
      paginationOptions: { page, limit },
    });

    return pagination(data, total, { page, limit });
  }

  @ApiOkResponse({ type: Number })
  @ApiOperation({ operationId: 'getUnreadCount', summary: '获取未读通知数量' })
  @Get('unread-count')
  @HttpCode(HttpStatus.OK)
  getUnreadCount(@Request() request: RequestWithUser): Promise<number> {
    return this.notificationsService.getUnreadCount(request.user.id);
  }

  @ApiOkResponse({ type: [NotificationSetting] })
  @ApiOperation({ operationId: 'getNotificationSettings', summary: '获取通知设置' })
  @Get('settings')
  @HttpCode(HttpStatus.OK)
  getSettings(@Request() request: RequestWithUser): Promise<NotificationSetting[]> {
    return this.notificationsService.getSettings(request.user.id);
  }

  @ApiOkResponse({ type: Notification })
  @ApiOperation({ operationId: 'getNotification', summary: '获取通知详情' })
  @ApiParam({ name: 'id', type: String })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Request() request: RequestWithUser, @Param('id') id: string): Promise<Notification> {
    return this.notificationsService.findOne(id, request.user.id);
  }

  @ApiOkResponse()
  @ApiOperation({ operationId: 'markAllNotificationsAsRead', summary: '标记所有通知为已读' })
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Request() request: RequestWithUser): Promise<void> {
    return this.notificationsService.markAllAsRead(request.user.id);
  }

  @ApiOkResponse({ type: NotificationSetting })
  @ApiOperation({ operationId: 'updateNotificationSettings', summary: '更新通知设置' })
  @Patch('settings')
  @HttpCode(HttpStatus.OK)
  updateSettings(
    @Request() request: RequestWithUser,
    @Body() updateDto: UpdateNotificationSettingsDto,
  ): Promise<NotificationSetting> {
    return this.notificationsService.updateSettings(request.user.id, updateDto);
  }

  @ApiOkResponse({ type: Notification })
  @ApiOperation({ operationId: 'markNotificationAsRead', summary: '标记通知为已读' })
  @ApiParam({ name: 'id', type: String })
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  markAsRead(@Request() request: RequestWithUser, @Param('id') id: string): Promise<Notification> {
    return this.notificationsService.markAsRead(id, request.user.id);
  }

  @ApiOkResponse()
  @ApiOperation({ operationId: 'deleteNotification', summary: '删除通知' })
  @ApiParam({ name: 'id', type: String })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Request() request: RequestWithUser, @Param('id') id: string): Promise<void> {
    return this.notificationsService.remove(id, request.user.id);
  }
}

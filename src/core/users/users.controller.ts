import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
  SerializeOptions,
} from '@nestjs/common';
import { ParseIdPipe } from '../../common/pipes/parse-id.pipe';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../../common/dto/infinity-pagination-response.dto';
import { NullableType } from '../../common/types/nullable.type';
import { QueryUserDto } from './dto/query-user.dto';
import { User } from './domain/user';
import { UsersService } from './users.service';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermissions } from '../permissions/permissions.decorator';
import { Permission } from '../permissions/permission.enum';
import { infinityPagination } from '../../common/infinity-pagination';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@ApiTags('Users')
@Controller({
  path: 'users',
  version: '1',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiCreatedResponse({
    type: User,
  })
  @ApiOperation({ operationId: 'createUser', summary: '创建用户（管理员）' })
  @SerializeOptions({
    groups: ['admin'],
  })
  @RequirePermissions(Permission.USER_CREATE)
  @Post()
  @HttpCode(HttpStatus.OK)
  create(@Body() createProfileDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createProfileDto);
  }

  @ApiOkResponse({
    type: InfinityPaginationResponse(User),
  })
  @ApiOperation({ operationId: 'getUsers', summary: '获取用户列表（管理员）' })
  @SerializeOptions({
    groups: ['admin'],
  })
  @RequirePermissions(Permission.USER_LIST)
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: QueryUserDto): Promise<InfinityPaginationResponseDto<User>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.usersService.findManyWithPagination({
        filterOptions: query?.filters,
        sortOptions: query?.sort,
        paginationOptions: {
          page,
          limit,
        },
      }),
      { page, limit },
    );
  }

  @ApiOkResponse({
    type: User,
  })
  @ApiOperation({ operationId: 'getUser', summary: '获取用户详情（管理员）' })
  @SerializeOptions({
    groups: ['admin'],
  })
  @RequirePermissions(Permission.USER_READ)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  findOne(@Param('id', ParseIdPipe) id: number): Promise<NullableType<User>> {
    return this.usersService.findById(id);
  }

  @ApiOkResponse({
    type: User,
  })
  @ApiOperation({ operationId: 'updateUser', summary: '更新用户（管理员）' })
  @SerializeOptions({
    groups: ['admin'],
  })
  @RequirePermissions(Permission.USER_UPDATE)
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  update(@Param('id', ParseIdPipe) id: number, @Body() updateProfileDto: UpdateUserDto): Promise<User | null> {
    return this.usersService.updateByAdmin(id, updateProfileDto);
  }

  @ApiOperation({ operationId: 'deleteUser', summary: '删除用户（管理员）' })
  @RequirePermissions(Permission.USER_DELETE)
  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIdPipe) id: number): Promise<void> {
    return this.usersService.remove(id);
  }
}

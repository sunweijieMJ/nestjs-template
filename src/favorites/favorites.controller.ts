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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { QueryFavoriteDto } from './dto/query-favorite.dto';
import { CheckFavoriteDto, CheckFavoriteResponseDto } from './dto/check-favorite.dto';
import { Favorite } from './domain/favorite';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';

interface RequestWithUser {
  user: JwtPayloadType;
}

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Favorites')
@Controller({
  path: 'favorites',
  version: '1',
})
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @ApiCreatedResponse({ type: Favorite })
  @ApiOperation({ operationId: 'createFavorite', summary: '添加收藏' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Request() request: RequestWithUser,
    @Body() createFavoriteDto: CreateFavoriteDto,
  ): Promise<Favorite> {
    return this.favoritesService.create(request.user.id, createFavoriteDto);
  }

  @ApiOkResponse({ type: InfinityPaginationResponse(Favorite) })
  @ApiOperation({ operationId: 'getFavorites', summary: '获取收藏列表' })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Request() request: RequestWithUser,
    @Query() query: QueryFavoriteDto,
  ): Promise<InfinityPaginationResponseDto<Favorite>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.favoritesService.findManyWithPagination({
        userId: request.user.id,
        targetType: query?.targetType,
        paginationOptions: { page, limit },
      }),
      { page, limit },
    );
  }

  @ApiOkResponse({ type: CheckFavoriteResponseDto })
  @ApiOperation({ operationId: 'checkFavorite', summary: '检查是否已收藏' })
  @Post('check')
  @HttpCode(HttpStatus.OK)
  check(
    @Request() request: RequestWithUser,
    @Body() checkFavoriteDto: CheckFavoriteDto,
  ): Promise<CheckFavoriteResponseDto> {
    return this.favoritesService.check(
      request.user.id,
      checkFavoriteDto.targetType,
      checkFavoriteDto.targetId,
    );
  }

  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        isFavorited: { type: 'boolean' },
        favorite: { $ref: '#/components/schemas/Favorite' },
      },
    },
  })
  @ApiOperation({ operationId: 'toggleFavorite', summary: '切换收藏状态' })
  @Post('toggle')
  @HttpCode(HttpStatus.OK)
  toggle(
    @Request() request: RequestWithUser,
    @Body() createFavoriteDto: CreateFavoriteDto,
  ): Promise<{ isFavorited: boolean; favorite?: Favorite }> {
    return this.favoritesService.toggle(request.user.id, createFavoriteDto);
  }

  @ApiOperation({ operationId: 'deleteFavorite', summary: '取消收藏' })
  @Delete(':id')
  @ApiParam({ name: 'id', type: String, required: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() request: RequestWithUser, @Param('id') id: Favorite['id']): Promise<void> {
    return this.favoritesService.remove(id, request.user.id);
  }
}

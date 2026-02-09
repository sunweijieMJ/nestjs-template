import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { Order } from './domain/order';
import { OrderItem } from './domain/order-item';
import { RequestWithUser } from '../../common/types/request-with-user.type';
import { PaginationResponseDto } from '../../common/dto/pagination-response.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'orders',
  version: '1',
})
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'createOrder', summary: '创建订单' })
  @ApiCreatedResponse({ type: Order })
  async create(
    @Request() request: RequestWithUser,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<Order & { items: OrderItem[] }> {
    return this.ordersService.create(request.user.id, createOrderDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'getOrders', summary: '获取订单列表' })
  @ApiOkResponse({ type: PaginationResponseDto })
  async findAll(
    @Request() request: RequestWithUser,
    @Query() query: QueryOrderDto,
  ): Promise<PaginationResponseDto<Order>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) limit = 50;

    const [list, total] = await Promise.all([
      this.ordersService.findManyWithPagination(request.user.id, query, { page, limit }),
      this.ordersService.count(request.user.id, query),
    ]);

    return {
      list,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'getOrder', summary: '获取订单详情' })
  @ApiOkResponse({ type: Order })
  async findOne(@Request() request: RequestWithUser, @Param('id') id: string): Promise<Order & { items: OrderItem[] }> {
    return this.ordersService.findOne(id, request.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'cancelOrder', summary: '取消未支付订单' })
  async cancel(@Request() request: RequestWithUser, @Param('id') id: string): Promise<void> {
    return this.ordersService.cancelOrder(id, request.user.id);
  }
}

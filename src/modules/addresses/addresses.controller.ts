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
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { QueryAddressDto } from './dto/query-address.dto';
import { Address } from './domain/address';
import { NullableType } from '../../common/types/nullable.type';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../../common/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../../common/infinity-pagination';
import { JwtPayloadType } from '../../core/auth/strategies/types/jwt-payload.type';

interface RequestWithUser {
  user: JwtPayloadType;
}

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Addresses')
@Controller({
  path: 'addresses',
  version: '1',
})
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @ApiCreatedResponse({ type: Address })
  @ApiOperation({ operationId: 'createAddress', summary: '创建地址' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Request() request: RequestWithUser, @Body() createAddressDto: CreateAddressDto): Promise<Address> {
    return this.addressesService.create(request.user.id, createAddressDto);
  }

  @ApiOkResponse({
    type: InfinityPaginationResponse(Address),
  })
  @ApiOperation({ operationId: 'getAddresses', summary: '获取地址列表' })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Request() request: RequestWithUser,
    @Query() query: QueryAddressDto,
  ): Promise<InfinityPaginationResponseDto<Address>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.addressesService.findManyWithPagination({
        userId: request.user.id,
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

  @ApiOkResponse({ type: Address })
  @ApiOperation({ operationId: 'getDefaultAddress', summary: '获取默认地址' })
  @Get('default')
  @HttpCode(HttpStatus.OK)
  findDefault(@Request() request: RequestWithUser): Promise<NullableType<Address>> {
    return this.addressesService.findDefaultByUserId(request.user.id);
  }

  @ApiOkResponse({ type: Address })
  @ApiOperation({ operationId: 'getAddress', summary: '获取地址详情' })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  findOne(@Request() request: RequestWithUser, @Param('id') id: Address['id']): Promise<NullableType<Address>> {
    return this.addressesService.findById(id, request.user.id);
  }

  @ApiOkResponse({ type: Address })
  @ApiOperation({ operationId: 'updateAddress', summary: '更新地址' })
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  update(
    @Request() request: RequestWithUser,
    @Param('id') id: Address['id'],
    @Body() updateAddressDto: UpdateAddressDto,
  ): Promise<Address> {
    return this.addressesService.update(id, request.user.id, updateAddressDto);
  }

  @ApiOkResponse({ type: Address })
  @ApiOperation({ operationId: 'setDefaultAddress', summary: '设为默认地址' })
  @Put(':id/default')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  setDefault(@Request() request: RequestWithUser, @Param('id') id: Address['id']): Promise<Address> {
    return this.addressesService.setDefault(id, request.user.id);
  }

  @ApiOperation({ operationId: 'deleteAddress', summary: '删除地址' })
  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() request: RequestWithUser, @Param('id') id: Address['id']): Promise<void> {
    return this.addressesService.remove(id, request.user.id);
  }
}

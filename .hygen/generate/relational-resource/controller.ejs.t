---
to: src/modules/<%= h.inflection.transform(name, ['pluralize', 'underscore', 'dasherize']) %>/<%= h.inflection.transform(name, ['pluralize', 'underscore', 'dasherize']) %>.controller.ts
---
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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ParseIdPipe } from '../../common/pipes/parse-id.pipe';
import { <%= h.inflection.transform(name, ['pluralize']) %>Service } from './<%= h.inflection.transform(name, ['pluralize', 'underscore', 'dasherize']) %>.service';
import { Create<%= name %>Dto } from './dto/create-<%= h.inflection.transform(name, ['underscore', 'dasherize']) %>.dto';
import { Update<%= name %>Dto } from './dto/update-<%= h.inflection.transform(name, ['underscore', 'dasherize']) %>.dto';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { <%= name %> } from './domain/<%= h.inflection.transform(name, ['underscore', 'dasherize']) %>';
import { AuthGuard } from '@nestjs/passport';
import {
  PaginationResponse,
  PaginationResponseDto,
} from '../../common/dto/pagination-response.dto';
import { pagination } from '../../common/pagination';
import { FindAll<%= h.inflection.transform(name, ['pluralize']) %>Dto } from './dto/find-all-<%= h.inflection.transform(name, ['pluralize', 'underscore', 'dasherize']) %>.dto';

@ApiTags('<%= h.inflection.transform(name, ['pluralize', 'humanize']) %>')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: '<%= h.inflection.transform(name, ['pluralize', 'underscore', 'dasherize']) %>',
  version: '1',
})
export class <%= h.inflection.transform(name, ['pluralize']) %>Controller {
  constructor(private readonly <%= h.inflection.camelize(h.inflection.pluralize(name), true) %>Service: <%= h.inflection.transform(name, ['pluralize']) %>Service) {}

  @ApiOkResponse({
    type: <%= name %>,
  })
  @ApiOperation({ operationId: 'create<%= name %>', summary: 'Create <%= name %>' })
  @Post()
  @HttpCode(HttpStatus.OK)
  create(@Body() create<%= name %>Dto: Create<%= name %>Dto): Promise<<%= name %>> {
    return this.<%= h.inflection.camelize(h.inflection.pluralize(name), true) %>Service.create(create<%= name %>Dto);
  }

  @ApiOkResponse({
    type: PaginationResponse(<%= name %>),
  })
  @ApiOperation({ operationId: 'get<%= h.inflection.transform(name, ['pluralize']) %>', summary: 'List <%= h.inflection.transform(name, ['pluralize']) %>' })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: FindAll<%= h.inflection.transform(name, ['pluralize']) %>Dto,
  ): Promise<PaginationResponseDto<<%= name %>>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    const { data, total } = await this.<%= h.inflection.camelize(h.inflection.pluralize(name), true) %>Service.findManyWithPaginationAndCount({
      paginationOptions: {
        page,
        limit,
      },
    });

    return pagination(data, total, { page, limit });
  }

  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @ApiOkResponse({
    type: <%= name %>,
  })
  @ApiOperation({ operationId: 'get<%= name %>', summary: 'Get <%= name %>' })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id', ParseIdPipe) id: number): Promise<<%= name %>> {
    return this.<%= h.inflection.camelize(h.inflection.pluralize(name), true) %>Service.findOne(id);
  }

  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @ApiOkResponse({
    type: <%= name %>,
  })
  @ApiOperation({ operationId: 'update<%= name %>', summary: 'Update <%= name %>' })
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseIdPipe) id: number,
    @Body() update<%= name %>Dto: Update<%= name %>Dto,
  ): Promise<<%= name %>> {
    return this.<%= h.inflection.camelize(h.inflection.pluralize(name), true) %>Service.update(id, update<%= name %>Dto);
  }

  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @ApiOperation({ operationId: 'delete<%= name %>', summary: 'Delete <%= name %>' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIdPipe) id: number): Promise<void> {
    return this.<%= h.inflection.camelize(h.inflection.pluralize(name), true) %>Service.remove(id);
  }
}

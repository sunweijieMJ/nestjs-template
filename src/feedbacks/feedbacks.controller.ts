import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FeedbacksService } from './feedbacks.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { QueryFeedbackDto } from './dto/query-feedback.dto';
import { Feedback } from './domain/feedback';
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
@ApiTags('Feedbacks')
@Controller({
  path: 'feedbacks',
  version: '1',
})
export class FeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  @ApiCreatedResponse({ type: Feedback })
  @ApiOperation({ operationId: 'createFeedback', summary: '提交反馈' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Request() request: RequestWithUser, @Body() createFeedbackDto: CreateFeedbackDto): Promise<Feedback> {
    return this.feedbacksService.create(request.user.id, createFeedbackDto);
  }

  @ApiOkResponse({ type: InfinityPaginationResponse(Feedback) })
  @ApiOperation({ operationId: 'getFeedbacks', summary: '获取反馈列表' })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Request() request: RequestWithUser,
    @Query() query: QueryFeedbackDto,
  ): Promise<InfinityPaginationResponseDto<Feedback>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.feedbacksService.findManyWithPagination({
        userId: request.user.id,
        type: query?.type,
        status: query?.status,
        paginationOptions: { page, limit },
      }),
      { page, limit },
    );
  }

  @ApiOkResponse({ type: Feedback })
  @ApiOperation({ operationId: 'getFeedback', summary: '获取反馈详情' })
  @Get(':id')
  @ApiParam({ name: 'id', type: String, required: true })
  @HttpCode(HttpStatus.OK)
  async findOne(@Request() request: RequestWithUser, @Param('id') id: Feedback['id']): Promise<Feedback> {
    const feedback = await this.feedbacksService.findById(id);

    // Check if feedback exists and belongs to current user
    if (!feedback || feedback.userId.toString() !== request.user.id.toString()) {
      throw new NotFoundException({
        error: 'feedbackNotFound',
      });
    }

    return feedback;
  }
}

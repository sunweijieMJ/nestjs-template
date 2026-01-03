import { Injectable, Logger } from '@nestjs/common';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackRepository } from './infrastructure/persistence/feedback.repository';
import { Feedback, FeedbackStatus, FeedbackType } from './domain/feedback';
import { IPaginationOptions } from '../../common/types/pagination-options';

@Injectable()
export class FeedbacksService {
  private readonly logger = new Logger(FeedbacksService.name);

  constructor(private readonly feedbackRepository: FeedbackRepository) {}

  async create(userId: number | string, createFeedbackDto: CreateFeedbackDto): Promise<Feedback> {
    this.logger.log(`Creating feedback for user: ${userId}, type: ${createFeedbackDto.type}`);

    const feedback = await this.feedbackRepository.create({
      userId,
      type: createFeedbackDto.type,
      content: createFeedbackDto.content,
      images: createFeedbackDto.images,
      contact: createFeedbackDto.contact,
    });

    this.logger.log(`Feedback created: ${feedback.id}`);
    return feedback;
  }

  async findManyWithPagination({
    userId,
    type,
    status,
    paginationOptions,
  }: {
    userId: Feedback['userId'];
    type?: FeedbackType;
    status?: FeedbackStatus;
    paginationOptions: IPaginationOptions;
  }): Promise<Feedback[]> {
    return this.feedbackRepository.findManyWithPagination({
      userId,
      type,
      status,
      paginationOptions,
    });
  }

  async findById(id: Feedback['id']): Promise<Feedback | null> {
    return this.feedbackRepository.findById(id);
  }

  async countByUserId(userId: Feedback['userId']): Promise<number> {
    return this.feedbackRepository.countByUserId(userId);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { FeedbackEntity } from '../entities/feedback.entity';
import { FeedbackRepository } from '../../feedback.repository';
import { Feedback, FeedbackStatus, FeedbackType } from '../../../../domain/feedback';
import { FeedbackMapper } from '../mappers/feedback.mapper';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class FeedbackRelationalRepository implements FeedbackRepository {
  constructor(
    @InjectRepository(FeedbackEntity)
    private readonly feedbackRepository: Repository<FeedbackEntity>,
  ) {}

  async create(data: Omit<Feedback, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Feedback> {
    const entity = this.feedbackRepository.create({
      ...FeedbackMapper.toPersistence(data),
      status: FeedbackStatus.PENDING,
    });
    const saved = await this.feedbackRepository.save(entity);
    return FeedbackMapper.toDomain(saved);
  }

  async findById(id: Feedback['id']): Promise<NullableType<Feedback>> {
    const entity = await this.feedbackRepository.findOne({
      where: { id: Number(id) },
    });
    return entity ? FeedbackMapper.toDomain(entity) : null;
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
    const where: FindOptionsWhere<FeedbackEntity> = {
      userId: Number(userId),
    };

    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }

    const entities = await this.feedbackRepository.find({
      where,
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      order: { createdAt: 'DESC' },
    });

    return entities.map(FeedbackMapper.toDomain);
  }

  async countByUserId(userId: Feedback['userId']): Promise<number> {
    return this.feedbackRepository.count({
      where: { userId: Number(userId) },
    });
  }
}

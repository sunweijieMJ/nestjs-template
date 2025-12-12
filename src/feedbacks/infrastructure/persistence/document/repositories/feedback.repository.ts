import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, Types } from 'mongoose';
import { FeedbackSchemaClass } from '../entities/feedback.schema';
import { FeedbackRepository } from '../../feedback.repository';
import { Feedback, FeedbackStatus, FeedbackType } from '../../../../domain/feedback';
import { FeedbackMapper } from '../mappers/feedback.mapper';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class FeedbackDocumentRepository implements FeedbackRepository {
  constructor(
    @InjectModel(FeedbackSchemaClass.name)
    private readonly feedbackModel: Model<FeedbackSchemaClass>,
  ) {}

  async create(
    data: Omit<Feedback, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
  ): Promise<Feedback> {
    const created = new this.feedbackModel({
      userId: new Types.ObjectId(data.userId.toString()),
      type: data.type,
      content: data.content,
      images: data.images,
      contact: data.contact,
      status: FeedbackStatus.PENDING,
    });
    const saved = await created.save();
    return FeedbackMapper.toDomain(saved);
  }

  async findById(id: Feedback['id']): Promise<NullableType<Feedback>> {
    const doc = await this.feedbackModel.findById(id).exec();
    return doc ? FeedbackMapper.toDomain(doc) : null;
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
    const filter: FilterQuery<FeedbackSchemaClass> = {
      userId: new Types.ObjectId(userId.toString()),
    };

    if (type) {
      filter.type = type;
    }
    if (status) {
      filter.status = status;
    }

    const docs = await this.feedbackModel
      .find(filter)
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .limit(paginationOptions.limit)
      .sort({ createdAt: -1 })
      .exec();

    return docs.map(FeedbackMapper.toDomain);
  }

  async countByUserId(userId: Feedback['userId']): Promise<number> {
    return this.feedbackModel.countDocuments({
      userId: new Types.ObjectId(userId.toString()),
    });
  }
}

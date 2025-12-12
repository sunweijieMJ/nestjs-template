import { Feedback, FeedbackStatus, FeedbackType } from '../../domain/feedback';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';

export abstract class FeedbackRepository {
  abstract create(
    data: Omit<Feedback, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
  ): Promise<Feedback>;

  abstract findById(id: Feedback['id']): Promise<NullableType<Feedback>>;

  abstract findManyWithPagination({
    userId,
    type,
    status,
    paginationOptions,
  }: {
    userId: Feedback['userId'];
    type?: FeedbackType;
    status?: FeedbackStatus;
    paginationOptions: IPaginationOptions;
  }): Promise<Feedback[]>;

  abstract countByUserId(userId: Feedback['userId']): Promise<number>;
}

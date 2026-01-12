import { NullableType } from '../../../../common/types/nullable.type';
import { Share } from '../../domain/share';
import { DeepPartial } from '../../../../common/types/deep-partial.type';
import { IPaginationOptions } from '../../../../common/types/pagination-options';
import { QueryShareDto } from '../../dto/query-share.dto';

export abstract class ShareRepository {
  abstract create(data: Omit<Share, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Share>;

  abstract findManyWithPagination({
    userId,
    filterOptions,
    paginationOptions,
  }: {
    userId: Share['userId'];
    filterOptions?: QueryShareDto | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Share[]>;

  abstract findById(id: Share['id']): Promise<NullableType<Share>>;

  abstract findByIdAndUserId(id: Share['id'], userId: Share['userId']): Promise<NullableType<Share>>;

  abstract findByShareCode(shareCode: string): Promise<NullableType<Share>>;

  abstract update(id: Share['id'], payload: DeepPartial<Share>): Promise<Share | null>;

  abstract incrementViewCount(id: Share['id']): Promise<void>;

  abstract incrementClickCount(id: Share['id']): Promise<void>;

  abstract incrementConversionCount(id: Share['id']): Promise<void>;

  abstract countByUserId(userId: Share['userId'], filterOptions?: QueryShareDto | null): Promise<number>;

  abstract remove(id: Share['id']): Promise<void>;
}

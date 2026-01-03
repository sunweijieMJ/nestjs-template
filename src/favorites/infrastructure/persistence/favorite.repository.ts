import { NullableType } from '../../../utils/types/nullable.type';
import { Favorite, FavoriteTargetType } from '../../domain/favorite';
import { IPaginationOptions } from '../../../utils/types/pagination-options';

export abstract class FavoriteRepository {
  abstract create(data: Omit<Favorite, 'id' | 'createdAt'>): Promise<Favorite>;

  abstract findManyWithPagination({
    userId,
    targetType,
    paginationOptions,
  }: {
    userId: Favorite['userId'];
    targetType?: FavoriteTargetType;
    paginationOptions: IPaginationOptions;
  }): Promise<Favorite[]>;

  abstract findById(id: Favorite['id']): Promise<NullableType<Favorite>>;

  abstract findByUserAndTarget(
    userId: Favorite['userId'],
    targetType: FavoriteTargetType,
    targetId: string,
  ): Promise<NullableType<Favorite>>;

  abstract remove(id: Favorite['id']): Promise<void>;

  abstract removeByUserAndTarget(
    userId: Favorite['userId'],
    targetType: FavoriteTargetType,
    targetId: string,
  ): Promise<void>;

  abstract countByUserId(userId: Favorite['userId'], targetType?: FavoriteTargetType): Promise<number>;
}

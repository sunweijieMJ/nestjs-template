import { Favorite } from '../../../../domain/favorite';
import { FavoriteSchemaClass } from '../entities/favorite.schema';
import { Types } from 'mongoose';

export class FavoriteMapper {
  static toDomain(raw: FavoriteSchemaClass): Favorite {
    const domainEntity = new Favorite();
    domainEntity.id = raw._id.toString();
    domainEntity.userId = raw.userId.toString();
    domainEntity.targetType = raw.targetType;
    domainEntity.targetId = raw.targetId;
    domainEntity.title = raw.title;
    domainEntity.image = raw.image;
    domainEntity.extra = raw.extra;
    domainEntity.createdAt = raw.createdAt;
    return domainEntity;
  }

  static toPersistence(
    domainEntity: Omit<Favorite, 'id' | 'createdAt'>,
  ): Partial<FavoriteSchemaClass> {
    return {
      userId: new Types.ObjectId(String(domainEntity.userId)),
      targetType: domainEntity.targetType,
      targetId: domainEntity.targetId,
      title: domainEntity.title,
      image: domainEntity.image,
      extra: domainEntity.extra,
    };
  }
}

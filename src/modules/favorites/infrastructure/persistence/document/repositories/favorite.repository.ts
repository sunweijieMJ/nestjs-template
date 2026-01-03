import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { FavoriteSchemaClass } from '../entities/favorite.schema';
import { FavoriteRepository } from '../../favorite.repository';
import { FavoriteMapper } from '../mappers/favorite.mapper';
import { Favorite, FavoriteTargetType } from '../../../../domain/favorite';
import { NullableType } from '../../../../../../common/types/nullable.type';
import { IPaginationOptions } from '../../../../../../common/types/pagination-options';

@Injectable()
export class FavoriteDocumentRepository implements FavoriteRepository {
  constructor(
    @InjectModel(FavoriteSchemaClass.name)
    private readonly favoriteModel: Model<FavoriteSchemaClass>,
  ) {}

  async create(data: Omit<Favorite, 'id' | 'createdAt'>): Promise<Favorite> {
    const persistenceModel = FavoriteMapper.toPersistence(data);
    const createdFavorite = new this.favoriteModel(persistenceModel);
    const favoriteObject = await createdFavorite.save();
    return FavoriteMapper.toDomain(favoriteObject);
  }

  async findManyWithPagination({
    userId,
    targetType,
    paginationOptions,
  }: {
    userId: Favorite['userId'];
    targetType?: FavoriteTargetType;
    paginationOptions: IPaginationOptions;
  }): Promise<Favorite[]> {
    const where: FilterQuery<FavoriteSchemaClass> = {
      userId: new Types.ObjectId(String(userId)),
    };

    if (targetType) {
      where.targetType = targetType;
    }

    const favoriteObjects = await this.favoriteModel
      .find(where)
      .sort({ createdAt: -1 })
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .limit(paginationOptions.limit);

    return favoriteObjects.map((obj) => FavoriteMapper.toDomain(obj));
  }

  async findById(id: Favorite['id']): Promise<NullableType<Favorite>> {
    const favoriteObject = await this.favoriteModel.findById(new Types.ObjectId(String(id)));
    return favoriteObject ? FavoriteMapper.toDomain(favoriteObject) : null;
  }

  async findByUserAndTarget(
    userId: Favorite['userId'],
    targetType: FavoriteTargetType,
    targetId: string,
  ): Promise<NullableType<Favorite>> {
    const favoriteObject = await this.favoriteModel.findOne({
      userId: new Types.ObjectId(String(userId)),
      targetType,
      targetId,
    });
    return favoriteObject ? FavoriteMapper.toDomain(favoriteObject) : null;
  }

  async remove(id: Favorite['id']): Promise<void> {
    await this.favoriteModel.deleteOne({ _id: new Types.ObjectId(String(id)) });
  }

  async removeByUserAndTarget(
    userId: Favorite['userId'],
    targetType: FavoriteTargetType,
    targetId: string,
  ): Promise<void> {
    await this.favoriteModel.deleteOne({
      userId: new Types.ObjectId(String(userId)),
      targetType,
      targetId,
    });
  }

  async countByUserId(userId: Favorite['userId'], targetType?: FavoriteTargetType): Promise<number> {
    const where: FilterQuery<FavoriteSchemaClass> = {
      userId: new Types.ObjectId(String(userId)),
    };
    if (targetType) {
      where.targetType = targetType;
    }
    return this.favoriteModel.countDocuments(where);
  }
}

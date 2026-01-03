import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { FavoriteEntity } from '../entities/favorite.entity';
import { FavoriteRepository } from '../../favorite.repository';
import { FavoriteMapper } from '../mappers/favorite.mapper';
import { Favorite, FavoriteTargetType } from '../../../../domain/favorite';
import { NullableType } from '../../../../../../common/types/nullable.type';
import { IPaginationOptions } from '../../../../../../common/types/pagination-options';

@Injectable()
export class FavoriteRelationalRepository implements FavoriteRepository {
  constructor(
    @InjectRepository(FavoriteEntity)
    private readonly favoriteRepository: Repository<FavoriteEntity>,
  ) {}

  async create(data: Omit<Favorite, 'id' | 'createdAt'>): Promise<Favorite> {
    const persistenceModel = FavoriteMapper.toPersistence(data);
    const newEntity = await this.favoriteRepository.save(this.favoriteRepository.create(persistenceModel));
    return FavoriteMapper.toDomain(newEntity);
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
    const where: FindOptionsWhere<FavoriteEntity> = {
      userId: Number(userId),
    };

    if (targetType) {
      where.targetType = targetType;
    }

    const entities = await this.favoriteRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where,
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => FavoriteMapper.toDomain(entity));
  }

  async findById(id: Favorite['id']): Promise<NullableType<Favorite>> {
    const entity = await this.favoriteRepository.findOne({
      where: { id: Number(id) },
    });
    return entity ? FavoriteMapper.toDomain(entity) : null;
  }

  async findByUserAndTarget(
    userId: Favorite['userId'],
    targetType: FavoriteTargetType,
    targetId: string,
  ): Promise<NullableType<Favorite>> {
    const entity = await this.favoriteRepository.findOne({
      where: {
        userId: Number(userId),
        targetType,
        targetId,
      },
    });
    return entity ? FavoriteMapper.toDomain(entity) : null;
  }

  async remove(id: Favorite['id']): Promise<void> {
    await this.favoriteRepository.delete(id);
  }

  async removeByUserAndTarget(
    userId: Favorite['userId'],
    targetType: FavoriteTargetType,
    targetId: string,
  ): Promise<void> {
    await this.favoriteRepository.delete({
      userId: Number(userId),
      targetType,
      targetId,
    });
  }

  async countByUserId(userId: Favorite['userId'], targetType?: FavoriteTargetType): Promise<number> {
    const where: FindOptionsWhere<FavoriteEntity> = {
      userId: Number(userId),
    };
    if (targetType) {
      where.targetType = targetType;
    }
    return this.favoriteRepository.count({ where });
  }
}

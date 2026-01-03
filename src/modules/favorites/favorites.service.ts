import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { FavoriteRepository } from './infrastructure/persistence/favorite.repository';
import { Favorite, FavoriteTargetType } from './domain/favorite';
import { IPaginationOptions } from '../../common/types/pagination-options';
import { CheckFavoriteResponseDto } from './dto/check-favorite.dto';

@Injectable()
export class FavoritesService {
  private readonly logger = new Logger(FavoritesService.name);

  constructor(private readonly favoriteRepository: FavoriteRepository) {}

  async create(userId: number | string, createFavoriteDto: CreateFavoriteDto): Promise<Favorite> {
    this.logger.log(
      `Creating favorite for user: ${userId}, target: ${createFavoriteDto.targetType}:${createFavoriteDto.targetId}`,
    );

    // Check if already favorited
    const existing = await this.favoriteRepository.findByUserAndTarget(
      userId,
      createFavoriteDto.targetType,
      createFavoriteDto.targetId,
    );

    if (existing) {
      this.logger.warn(`Already favorited: ${createFavoriteDto.targetType}:${createFavoriteDto.targetId}`);
      throw new ConflictException({
        error: 'alreadyFavorited',
        message: 'This item is already in your favorites',
      });
    }

    const favorite = await this.favoriteRepository.create({
      userId,
      targetType: createFavoriteDto.targetType,
      targetId: createFavoriteDto.targetId,
      title: createFavoriteDto.title,
      image: createFavoriteDto.image,
      extra: createFavoriteDto.extra,
    });

    this.logger.log(`Favorite created: ${favorite.id}`);
    return favorite;
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
    return this.favoriteRepository.findManyWithPagination({
      userId,
      targetType,
      paginationOptions,
    });
  }

  async check(
    userId: number | string,
    targetType: FavoriteTargetType,
    targetId: string,
  ): Promise<CheckFavoriteResponseDto> {
    const favorite = await this.favoriteRepository.findByUserAndTarget(userId, targetType, targetId);
    return {
      isFavorited: !!favorite,
      favoriteId: favorite?.id,
    };
  }

  async remove(id: Favorite['id'], userId: Favorite['userId']): Promise<void> {
    this.logger.log(`Removing favorite: ${id} for user: ${userId}`);

    const favorite = await this.favoriteRepository.findById(id);
    if (!favorite || favorite.userId.toString() !== userId.toString()) {
      this.logger.warn(`Favorite ${id} not found or not owned by user ${userId}`);
      throw new NotFoundException({
        error: 'favoriteNotFound',
      });
    }

    await this.favoriteRepository.remove(id);
    this.logger.log(`Favorite removed: ${id}`);
  }

  async toggle(
    userId: number | string,
    createFavoriteDto: CreateFavoriteDto,
  ): Promise<{ isFavorited: boolean; favorite?: Favorite }> {
    const existing = await this.favoriteRepository.findByUserAndTarget(
      userId,
      createFavoriteDto.targetType,
      createFavoriteDto.targetId,
    );

    if (existing) {
      await this.favoriteRepository.remove(existing.id);
      this.logger.log(`Favorite toggled off: ${createFavoriteDto.targetType}:${createFavoriteDto.targetId}`);
      return { isFavorited: false };
    } else {
      const favorite = await this.favoriteRepository.create({
        userId,
        targetType: createFavoriteDto.targetType,
        targetId: createFavoriteDto.targetId,
        title: createFavoriteDto.title,
        image: createFavoriteDto.image,
        extra: createFavoriteDto.extra,
      });
      this.logger.log(`Favorite toggled on: ${favorite.id}`);
      return { isFavorited: true, favorite };
    }
  }

  async countByUserId(userId: Favorite['userId'], targetType?: FavoriteTargetType): Promise<number> {
    return this.favoriteRepository.countByUserId(userId, targetType);
  }
}

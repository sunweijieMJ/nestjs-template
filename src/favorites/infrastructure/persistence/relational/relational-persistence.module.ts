import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoriteEntity } from './entities/favorite.entity';
import { FavoriteRepository } from '../favorite.repository';
import { FavoriteRelationalRepository } from './repositories/favorite.repository';

@Module({
  imports: [TypeOrmModule.forFeature([FavoriteEntity])],
  providers: [
    {
      provide: FavoriteRepository,
      useClass: FavoriteRelationalRepository,
    },
  ],
  exports: [FavoriteRepository],
})
export class RelationalFavoritePersistenceModule {}

import { Module } from '@nestjs/common';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { RelationalFavoritePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [RelationalFavoritePersistenceModule],
  controllers: [FavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService, RelationalFavoritePersistenceModule],
})
export class FavoritesModule {}

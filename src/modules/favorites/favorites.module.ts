import { Module } from '@nestjs/common';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { DocumentFavoritePersistenceModule } from './infrastructure/persistence/document/document-persistence.module';
import { RelationalFavoritePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { DatabaseConfig } from '../../infrastructure/database/config/database-config.type';
import databaseConfig from '../../infrastructure/database/config/database.config';

// <database-block>
const infrastructurePersistenceModule = (databaseConfig() as DatabaseConfig).isDocumentDatabase
  ? DocumentFavoritePersistenceModule
  : RelationalFavoritePersistenceModule;
// </database-block>

@Module({
  imports: [infrastructurePersistenceModule],
  controllers: [FavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService, infrastructurePersistenceModule],
})
export class FavoritesModule {}

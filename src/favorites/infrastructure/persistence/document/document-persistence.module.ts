import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FavoriteSchemaClass, FavoriteSchema } from './entities/favorite.schema';
import { FavoriteRepository } from '../favorite.repository';
import { FavoriteDocumentRepository } from './repositories/favorite.repository';

@Module({
  imports: [MongooseModule.forFeature([{ name: FavoriteSchemaClass.name, schema: FavoriteSchema }])],
  providers: [
    {
      provide: FavoriteRepository,
      useClass: FavoriteDocumentRepository,
    },
  ],
  exports: [FavoriteRepository],
})
export class DocumentFavoritePersistenceModule {}

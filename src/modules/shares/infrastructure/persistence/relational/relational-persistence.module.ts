import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShareEntity } from './entities/share.entity';
import { ShareLogEntity } from './entities/share-log.entity';
import { ShareRepository } from '../share.repository';
import { ShareRelationalRepository } from './repositories/share.repository';
import { ShareLogRepository } from '../share-log.repository';
import { ShareLogRelationalRepository } from './repositories/share-log.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ShareEntity, ShareLogEntity])],
  providers: [
    {
      provide: ShareRepository,
      useClass: ShareRelationalRepository,
    },
    {
      provide: ShareLogRepository,
      useClass: ShareLogRelationalRepository,
    },
  ],
  exports: [ShareRepository, ShareLogRepository, TypeOrmModule],
})
export class RelationalSharePersistenceModule {}

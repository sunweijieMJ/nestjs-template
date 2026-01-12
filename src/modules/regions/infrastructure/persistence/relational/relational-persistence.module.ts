import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegionEntity } from './entities/region.entity';
import { RegionRepository } from '../region.repository';
import { RegionRelationalRepository } from './repositories/region.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RegionEntity])],
  providers: [
    {
      provide: RegionRepository,
      useClass: RegionRelationalRepository,
    },
  ],
  exports: [RegionRepository],
})
export class RelationalRegionPersistenceModule {}

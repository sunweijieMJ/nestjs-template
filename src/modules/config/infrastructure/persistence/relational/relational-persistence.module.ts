import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigEntity } from './entities/config.entity';
import { AppConfigRepository } from '../config.repository';
import { ConfigRelationalRepository } from './repositories/config.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ConfigEntity])],
  providers: [
    {
      provide: AppConfigRepository,
      useClass: ConfigRelationalRepository,
    },
  ],
  exports: [AppConfigRepository],
})
export class RelationalConfigPersistenceModule {}

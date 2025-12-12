import { Module } from '@nestjs/common';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';
import { DocumentAddressPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';
import { RelationalAddressPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { DatabaseConfig } from '../database/config/database-config.type';
import databaseConfig from '../database/config/database.config';

// <database-block>
const infrastructurePersistenceModule = (databaseConfig() as DatabaseConfig).isDocumentDatabase
  ? DocumentAddressPersistenceModule
  : RelationalAddressPersistenceModule;
// </database-block>

@Module({
  imports: [infrastructurePersistenceModule],
  controllers: [AddressesController],
  providers: [AddressesService],
  exports: [AddressesService, infrastructurePersistenceModule],
})
export class AddressesModule {}

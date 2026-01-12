import { Module } from '@nestjs/common';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';
import { RelationalAddressPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { RegionsModule } from '../regions/regions.module';

@Module({
  imports: [RelationalAddressPersistenceModule, RegionsModule],
  controllers: [AddressesController],
  providers: [AddressesService],
  exports: [AddressesService, RelationalAddressPersistenceModule],
})
export class AddressesModule {}

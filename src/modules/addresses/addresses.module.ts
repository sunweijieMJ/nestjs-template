import { Module } from '@nestjs/common';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';
import { RelationalAddressPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [RelationalAddressPersistenceModule],
  controllers: [AddressesController],
  providers: [AddressesService],
  exports: [AddressesService, RelationalAddressPersistenceModule],
})
export class AddressesModule {}

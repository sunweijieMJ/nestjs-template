import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AddressSchemaClass, AddressSchema } from './entities/address.schema';
import { AddressRepository } from '../address.repository';
import { AddressDocumentRepository } from './repositories/address.repository';

@Module({
  imports: [MongooseModule.forFeature([{ name: AddressSchemaClass.name, schema: AddressSchema }])],
  providers: [
    {
      provide: AddressRepository,
      useClass: AddressDocumentRepository,
    },
  ],
  exports: [AddressRepository],
})
export class DocumentAddressPersistenceModule {}

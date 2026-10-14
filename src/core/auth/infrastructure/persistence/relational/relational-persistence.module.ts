import { Module } from '@nestjs/common';
import { CredentialRepository } from '../credential.repository';
import { CredentialRelationalRepository } from './repositories/credential.repository';

@Module({
  providers: [{ provide: CredentialRepository, useClass: CredentialRelationalRepository }],
  exports: [CredentialRepository],
})
export class RelationalAuthPersistenceModule {}

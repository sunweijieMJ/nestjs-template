import { Module } from '@nestjs/common';

import { UsersController } from './users.controller';

import { UsersService } from './users.service';
import { RelationalUserPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { FilesModule } from '../../modules/files/files.module';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [RelationalUserPersistenceModule, FilesModule, SessionModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, RelationalUserPersistenceModule],
})
export class UsersModule {}

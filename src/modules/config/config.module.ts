import { Module } from '@nestjs/common';
import { AppConfigController } from './config.controller';
import { AppConfigService } from './config.service';
import { RelationalConfigPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [RelationalConfigPersistenceModule],
  controllers: [AppConfigController],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}

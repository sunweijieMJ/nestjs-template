import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogEntity } from './entities/audit-log.entity';
import { AuditLogRepository } from '../audit-log.repository';
import { AuditLogRelationalRepository } from './repositories/audit-log.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity])],
  providers: [
    {
      provide: AuditLogRepository,
      useClass: AuditLogRelationalRepository,
    },
  ],
  exports: [AuditLogRepository],
})
export class RelationalAuditPersistenceModule {}

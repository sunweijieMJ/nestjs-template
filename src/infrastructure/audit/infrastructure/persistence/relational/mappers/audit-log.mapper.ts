import { AuditLog } from '../../../../domain/audit-log';
import { AuditLogEntity } from '../entities/audit-log.entity';

export class AuditLogMapper {
  static toDomain(entity: AuditLogEntity): AuditLog {
    const domain = new AuditLog();
    domain.id = entity.id;
    domain.userId = entity.userId;
    domain.action = entity.action;
    domain.entityType = entity.entityType;
    domain.entityId = entity.entityId;
    domain.oldValue = entity.oldValue;
    domain.newValue = entity.newValue;
    domain.ipAddress = entity.ipAddress;
    domain.userAgent = entity.userAgent;
    domain.requestId = entity.requestId;
    domain.createdAt = entity.createdAt;
    return domain;
  }

  static toPersistence(domain: Omit<AuditLog, 'id' | 'createdAt'>): Partial<AuditLogEntity> {
    const entity = new AuditLogEntity();
    entity.userId = domain.userId?.toString() ?? null;
    entity.action = domain.action;
    entity.entityType = domain.entityType;
    entity.entityId = domain.entityId?.toString() ?? '';
    entity.oldValue = domain.oldValue;
    entity.newValue = domain.newValue;
    entity.ipAddress = domain.ipAddress;
    entity.userAgent = domain.userAgent;
    entity.requestId = domain.requestId;
    return entity;
  }
}

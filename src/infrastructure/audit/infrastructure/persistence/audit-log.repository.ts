import { AuditLog } from '../../domain/audit-log';
import { IPaginationOptions } from '../../../../common/types/pagination-options';

export interface FindAuditLogsOptions {
  userId?: string | number;
  entityType?: string;
  entityId?: string | number;
  action?: string;
  startDate?: Date;
  endDate?: Date;
}

export abstract class AuditLogRepository {
  abstract create(data: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog>;

  abstract findManyWithPagination(options: {
    filterOptions?: FindAuditLogsOptions;
    paginationOptions: IPaginationOptions;
  }): Promise<AuditLog[]>;

  abstract findById(id: AuditLog['id']): Promise<AuditLog | null>;

  abstract findByEntityId(entityType: string, entityId: string | number): Promise<AuditLog[]>;

  abstract findByUserId(userId: string | number): Promise<AuditLog[]>;
}

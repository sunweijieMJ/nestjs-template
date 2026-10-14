import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { EntityRelationalHelper } from '../../../../../../common/relational-entity-helper';
import { AuditAction } from '../../../../domain/audit-log';

@Entity({ name: 'audit_logs' })
export class AuditLogEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  @Index('IDX_audit_logs_userId')
  userId: string | null;

  @Column({ type: 'varchar', length: 50 })
  @Index('IDX_audit_logs_action')
  action: AuditAction;

  @Column({ type: 'varchar', length: 100 })
  @Index('IDX_audit_logs_entityType')
  entityType: string;

  @Column({ type: 'varchar' })
  @Index('IDX_audit_logs_entityId')
  entityId: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValue: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  newValue: Record<string, unknown> | null;

  @Column({ type: 'varchar', nullable: true })
  ipAddress: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', nullable: true })
  @Index('IDX_audit_logs_requestId')
  requestId: string | null;

  @CreateDateColumn()
  @Index('IDX_audit_logs_createdAt')
  createdAt: Date;
}

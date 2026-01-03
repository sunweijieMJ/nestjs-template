import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { EntityRelationalHelper } from '../../../../../../common/relational-entity-helper';
import { AuditAction } from '../../../../domain/audit-log';

@Entity({ name: 'audit_logs' })
export class AuditLogEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  @Index()
  userId: string | null;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  action: AuditAction;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  entityType: string;

  @Column({ type: 'varchar' })
  @Index()
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
  @Index()
  requestId: string | null;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}

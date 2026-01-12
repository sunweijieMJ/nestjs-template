import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { EntityRelationalHelper } from '../../../../../../common/relational-entity-helper';
import { ShareEntity } from './share.entity';

@Entity({
  name: 'share_log',
})
export class ShareLogEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  shareId: number;

  @ManyToOne(() => ShareEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shareId' })
  share: ShareEntity;

  @Index()
  @Column({ type: 'varchar', length: 20 })
  action: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  visitorIp: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  platform: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Index()
  @CreateDateColumn()
  createdAt: Date;
}

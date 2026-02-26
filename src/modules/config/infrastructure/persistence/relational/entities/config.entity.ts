import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { EntityRelationalHelper } from '../../../../../../common/relational-entity-helper';

@Entity({ name: 'config' })
export class ConfigEntity extends EntityRelationalHelper {
  @PrimaryColumn({ type: 'varchar', length: 200 })
  key: string;

  @Column({ type: 'jsonb' })
  value: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

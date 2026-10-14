import { Column, Entity, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { EntityRelationalHelper } from '../../../../common/relational-entity-helper';

@Entity({
  name: 'permission',
})
export class PermissionEntity extends EntityRelationalHelper {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @Index('IDX_PERMISSION_RESOURCE')
  @Column({ type: 'varchar', length: 50 })
  resource: string;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

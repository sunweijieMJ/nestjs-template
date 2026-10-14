import { Entity, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { EntityRelationalHelper } from '../../../../common/relational-entity-helper';
import { RoleEntity } from '../../../../common/enums/roles/role.entity';
import { PermissionEntity } from './permission.entity';

@Entity({
  name: 'role_permission',
})
export class RolePermissionEntity extends EntityRelationalHelper {
  @Index('IDX_ROLE_PERMISSION_ROLE')
  @PrimaryColumn({ name: 'role_id' })
  roleId: number;

  @Index('IDX_ROLE_PERMISSION_PERMISSION')
  @PrimaryColumn({ name: 'permission_id', type: 'varchar', length: 50 })
  permissionId: string;

  @ManyToOne(() => RoleEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id', foreignKeyConstraintName: 'FK_ROLE_PERMISSION_ROLE' })
  role: RoleEntity;

  @ManyToOne(() => PermissionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id', foreignKeyConstraintName: 'FK_ROLE_PERMISSION_PERMISSION' })
  permission: PermissionEntity;

  @CreateDateColumn()
  createdAt: Date;
}

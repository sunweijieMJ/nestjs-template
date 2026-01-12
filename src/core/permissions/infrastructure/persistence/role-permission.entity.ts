import { Entity, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { EntityRelationalHelper } from '../../../../common/relational-entity-helper';
import { RoleEntity } from '../../../../common/enums/roles/role.entity';
import { PermissionEntity } from './permission.entity';

@Entity({
  name: 'role_permission',
})
export class RolePermissionEntity extends EntityRelationalHelper {
  @PrimaryColumn({ name: 'role_id' })
  roleId: number;

  @PrimaryColumn({ name: 'permission_id', type: 'varchar', length: 50 })
  permissionId: string;

  @ManyToOne(() => RoleEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: RoleEntity;

  @ManyToOne(() => PermissionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: PermissionEntity;

  @CreateDateColumn()
  createdAt: Date;
}

import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../../common/relational-entity-helper';
import { UserEntity } from '../../../../../../core/users/infrastructure/persistence/relational/entities/user.entity';

@Entity({
  name: 'address',
})
@Index('IDX_address_userId_isDefault_createdAt', { synchronize: false })
@Index('IDX_address_deletedAt', ['deletedAt'], { where: '"deletedAt" IS NULL' })
export class AddressEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('IDX_address_userId')
  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', foreignKeyConstraintName: 'FK_address_user' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Index('IDX_address_provinceCode')
  @Column({ type: 'varchar', length: 12, nullable: true, comment: 'Province region code' })
  provinceCode: string | null;

  @Index('IDX_address_cityCode')
  @Column({ type: 'varchar', length: 12, nullable: true, comment: 'City region code' })
  cityCode: string | null;

  @Index('IDX_address_districtCode')
  @Column({ type: 'varchar', length: 12, nullable: true, comment: 'District region code' })
  districtCode: string | null;

  @Column({ type: 'varchar', length: 50 })
  province: string;

  @Column({ type: 'varchar', length: 50 })
  city: string;

  @Column({ type: 'varchar', length: 50 })
  district: string;

  @Column({ type: 'varchar', length: 200 })
  address: string;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

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
  OneToOne,
} from 'typeorm';
import { RoleEntity } from '../../../../../roles/role.entity';
import { StatusEntity } from '../../../../../statuses/status.entity';
import { FileEntity } from '../../../../../files/infrastructure/persistence/relational/entities/file.entity';

import { AuthProvidersEnum } from '../../../../../auth/auth-providers.enum';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({
  name: 'user',
})
export class UserEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  // For "string | null" we need to use String type.
  // More info: https://github.com/typeorm/typeorm/issues/2567
  @Column({ type: String, unique: true, nullable: true })
  email: string | null;

  @Column({ nullable: true })
  password?: string;

  @Column({ default: AuthProvidersEnum.email })
  provider: string;

  @Index()
  @Column({ type: String, nullable: true })
  firstName: string | null;

  @Index()
  @Column({ type: String, nullable: true })
  lastName: string | null;

  @Index()
  @Column({ type: String, unique: true, nullable: true })
  phone: string | null;

  @Column({ type: String, nullable: true })
  nickname: string | null;

  @Column({ type: 'int', default: 0, nullable: true })
  gender: number | null;

  @Column({ type: 'date', nullable: true })
  birthday: Date | null;

  @OneToOne(() => FileEntity)
  @JoinColumn()
  photo?: FileEntity | null;

  @ManyToOne(() => RoleEntity)
  role?: RoleEntity | null;

  @ManyToOne(() => StatusEntity)
  status?: StatusEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @Index()
  @Column({ type: String, unique: true, nullable: true })
  wechatOpenId: string | null;

  @Index()
  @Column({ type: String, nullable: true })
  wechatUnionId: string | null;
}

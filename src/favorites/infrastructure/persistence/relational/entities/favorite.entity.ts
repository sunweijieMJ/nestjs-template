import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  Unique,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { FavoriteTargetType } from '../../../../domain/favorite';

@Entity({ name: 'favorite' })
@Unique(['userId', 'targetType', 'targetId'])
export class FavoriteEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Index()
  @Column({ type: 'varchar', length: 20 })
  targetType: FavoriteTargetType;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  targetId: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  title?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image?: string;

  @Column({ type: 'text', nullable: true })
  extra?: string;

  @CreateDateColumn()
  createdAt: Date;
}

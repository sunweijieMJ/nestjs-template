import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from '../../../../../../core/users/infrastructure/persistence/relational/entities/user.entity';
import { FeedbackType, FeedbackStatus } from '../../../../domain/feedback';
import { EntityRelationalHelper } from '../../../../../../common/relational-entity-helper';

@Entity({ name: 'feedback' })
export class FeedbackEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  @Index()
  userId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 20 })
  @Index()
  type: FeedbackType;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'simple-array', nullable: true })
  images?: string[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  contact?: string;

  @Column({ type: 'varchar', length: 20, default: FeedbackStatus.PENDING })
  @Index()
  status: FeedbackStatus;

  @Column({ type: 'text', nullable: true })
  reply?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

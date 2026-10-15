import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../../common/relational-entity-helper';
import { UserEntity } from '../../../../../../core/users/infrastructure/persistence/relational/entities/user.entity';
import { OrderItemEntity } from './order-item.entity';

@Entity({ name: 'order' })
@Index('IDX_order_status_expiresAt', ['status', 'expiresAt'])
export class OrderEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('IDX_order_userId')
  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', foreignKeyConstraintName: 'FK_order_user' })
  user: UserEntity;

  @Index('IDX_order_orderNo')
  @Column({ type: 'varchar', length: 32, unique: true })
  orderNo: string;

  @Index('IDX_order_status')
  @Column({ type: 'varchar', length: 20, default: 'UNPAID' })
  status: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  paymentChannel: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  transactionId: string | null;

  @Column({ type: 'int' })
  totalAmount: number;

  @Column({ type: 'int', nullable: true })
  paidAmount: number | null;

  @Column({ type: 'int', default: 0 })
  refundedAmount: number;

  @Column({ type: 'varchar', length: 64, array: true, default: () => "'{}'" })
  refundNos: string[];

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  refundedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @OneToMany(() => OrderItemEntity, (item) => item.order)
  items: OrderItemEntity[];

  @Index('IDX_order_createdAt')
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

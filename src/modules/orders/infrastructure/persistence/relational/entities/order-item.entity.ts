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
import { EntityRelationalHelper } from '../../../../../../common/relational-entity-helper';
import { OrderEntity } from './order.entity';

@Entity({ name: 'order_item' })
export class OrderItemEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  orderId: number;

  @ManyToOne(() => OrderEntity, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: OrderEntity;

  @Column({ type: 'varchar', length: 100 })
  productId: string;

  @Column({ type: 'varchar', length: 200 })
  productName: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  productImage: string | null;

  @Column({ type: 'int' })
  unitPrice: number;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'int' })
  subtotal: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

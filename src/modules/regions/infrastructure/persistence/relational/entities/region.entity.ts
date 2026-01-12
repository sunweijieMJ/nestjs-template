import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EntityRelationalHelper } from '../../../../../../common/relational-entity-helper';

@Entity({
  name: 'region',
})
@Index(['level', 'parentCode'])
export class RegionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 12, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Index()
  @Column({ type: 'int' })
  level: number;

  @Index()
  @Column({ type: 'varchar', length: 12, nullable: true })
  parentCode: string | null;

  @Column({ type: 'int', default: 0 })
  sort: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

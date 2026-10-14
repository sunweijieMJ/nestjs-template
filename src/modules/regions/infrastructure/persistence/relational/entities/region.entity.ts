import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EntityRelationalHelper } from '../../../../../../common/relational-entity-helper';

@Entity({
  name: 'region',
  comment: 'Administrative division data (Province/City/District)',
})
@Index('IDX_region_level_parentCode', ['level', 'parentCode'])
export class RegionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('IDX_region_code')
  @Column({ type: 'varchar', length: 12, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Index('IDX_region_level')
  @Column({ type: 'int' })
  level: number;

  @Index('IDX_region_parentCode')
  @Column({ type: 'varchar', length: 12, nullable: true })
  parentCode: string | null;

  @Column({ type: 'int', default: 0 })
  sort: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

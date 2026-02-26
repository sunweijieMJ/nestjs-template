# 数据库开发规范

> 依赖：[module-development](./module-development.md)

## 技术栈

- **ORM**: TypeORM 0.3.x
- **数据库**: PostgreSQL
- **迁移**: TypeORM CLI

## Entity 规范

### Persistence Entity（TypeORM）

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { EntityRelationalHelper } from '@/common/utils/relational-entity-helper';

@Entity({ name: 'feature' })
export class FeatureEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: String })
  @Index()
  name: string;

  @Column({ type: String, nullable: true })
  description: string | null;

  @ManyToOne(() => UserEntity, { eager: false })
  user: UserEntity;

  @Column({ type: Number })
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
```

**规则**：

- 继承 `EntityRelationalHelper`
- 使用 `{ name: 'table_name' }` 显式指定表名
- 必加 `@CreateDateColumn`, `@UpdateDateColumn`
- 软删除使用 `@DeleteDateColumn`
- 频繁查询字段添加 `@Index()`
- 关联字段同时声明关系和外键列（`user` + `userId`）

### Domain Entity（纯业务）

```typescript
import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class Feature {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @Exclude({ toPlainOnly: true })
  user?: User;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
```

**规则**：

- 无 TypeORM 装饰器
- 使用 `class-transformer` 控制序列化（`@Exclude`, `@Expose`）
- 使用 `@ApiProperty` 装饰 Swagger 文档
- 可选的敏感字段用 `@Exclude({ toPlainOnly: true })`

## Migration 操作

### 生成迁移

```bash
# 修改 Entity 后，自动生成迁移文件
pnpm migration:generate -- src/infrastructure/database/migrations/FeatureName

# 创建空迁移（手写 SQL）
pnpm migration:create -- src/infrastructure/database/migrations/ManualMigration
```

### 执行/回滚

```bash
pnpm migration:run      # 执行所有未运行的迁移
pnpm migration:revert   # 回滚最近一次迁移
```

### 迁移规则

1. **生成后必须审查** — 检查 SQL 是否符合预期
2. **已提交的迁移禁止修改** — 生成新迁移来修正
3. **迁移文件按时间戳排序** — 不要手动改文件名
4. **生产环境禁止 `synchronize: true`** — 只能通过迁移变更结构

## Repository 实现

```typescript
@Injectable()
export class FeatureRelationalRepository implements FeatureRepository {
  constructor(
    @InjectRepository(FeatureEntity)
    private readonly repo: Repository<FeatureEntity>,
  ) {}

  async create(data: Feature): Promise<Feature> {
    const entity = FeatureMapper.toPersistence(data);
    const saved = await this.repo.save(this.repo.create(entity));
    return FeatureMapper.toDomain(saved);
  }

  async findById(id: Feature['id']): Promise<NullableType<Feature>> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? FeatureMapper.toDomain(entity) : null;
  }

  async findManyWithPagination({ paginationOptions }: { paginationOptions: IPaginationOptions }): Promise<Feature[]> {
    const entities = await this.repo.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      order: { createdAt: 'DESC' },
    });
    return entities.map(FeatureMapper.toDomain);
  }

  async update(id: Feature['id'], payload: DeepPartial<Feature>): Promise<Feature | null> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) return null;

    const updated = await this.repo.save(
      this.repo.create(FeatureMapper.toPersistence({ ...FeatureMapper.toDomain(entity), ...payload } as Feature)),
    );
    return FeatureMapper.toDomain(updated);
  }

  async remove(id: Feature['id']): Promise<void> {
    await this.repo.softDelete(id);
  }
}
```

**规则**：

- 所有入参/出参经过 Mapper 转换
- 删除使用 `softDelete`（配合 `@DeleteDateColumn`）
- 分页使用 `skip/take` 模式
- 关联查询使用 `relations` 或 `QueryBuilder`

## 数据库种子

```bash
pnpm seed:run:relational   # 开发环境种子数据
pnpm seed:run:prod         # 生产环境种子数据
```

种子文件位于 `src/infrastructure/database/seeds/`。

## 事务管理

```typescript
import { TransactionService } from '@/infrastructure/database/transaction/transaction.service';

@Injectable()
export class OrderService {
  constructor(private readonly transactionService: TransactionService) {}

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    return this.transactionService.run(async (manager) => {
      // 在同一事务中执行多个操作
      const order = await manager.save(OrderEntity, orderData);
      await manager.save(OrderItemEntity, items);
      return OrderMapper.toDomain(order);
    });
  }
}
```

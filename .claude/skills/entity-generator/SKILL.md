---
name: entity-generator
description: 生成 Entity + Mapper + Repository + Migration
triggers:
  - '生成实体'
  - '新建实体'
  - '添加表'
  - 'create entity'
---

# Entity 生成器

为已有模块生成数据库层相关文件。

## 输入

- **实体名称**：如 `Product`
- **所属模块**：如 `src/modules/products`
- **字段列表**：字段名、类型、是否必填、是否索引

## 生成文件

1. **Domain Entity** — `domain/{singular}.ts`
2. **Persistence Entity** — `infrastructure/persistence/relational/entities/{singular}.entity.ts`
3. **Mapper** — `infrastructure/persistence/relational/mappers/{singular}.mapper.ts`
4. **Repository Port** — `infrastructure/persistence/{singular}.repository.ts`
5. **Repository Implementation** — `infrastructure/persistence/relational/repositories/{singular}.repository.ts`
6. **Persistence Module** — `infrastructure/persistence/relational/relational-persistence.module.ts`

## 字段类型映射

| 业务类型 | TypeORM Column                               | TypeScript                        |
| -------- | -------------------------------------------- | --------------------------------- |
| string   | `@Column({ type: String })`                  | `string`                          |
| string?  | `@Column({ type: String, nullable: true })`  | `string \| null`                  |
| number   | `@Column({ type: Number })`                  | `number`                          |
| boolean  | `@Column({ type: Boolean, default: false })` | `boolean`                         |
| date     | `@Column({ type: 'timestamp' })`             | `Date`                            |
| enum     | `@Column({ type: 'enum', enum: XxxEnum })`   | `XxxEnum`                         |
| json     | `@Column({ type: 'jsonb', nullable: true })` | `Record<string, unknown> \| null` |

## 关联类型

| 关系   | 装饰器                                         | 说明                    |
| ------ | ---------------------------------------------- | ----------------------- |
| 多对一 | `@ManyToOne(() => XxxEntity)`                  | 同时声明 `xxxId` 外键列 |
| 一对多 | `@OneToMany(() => XxxEntity, (x) => x.parent)` | 反向关联                |
| 一对一 | `@OneToOne(() => XxxEntity)` + `@JoinColumn()` | 拥有方加 JoinColumn     |

## 后续步骤

生成后执行：

```bash
pnpm migration:generate -- src/infrastructure/database/migrations/AddXxxTable
pnpm migration:run
```

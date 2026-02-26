---
name: module-generator
description: 生成完整的 NestJS 业务模块（六边形架构）
triggers:
  - '生成模块'
  - '新建模块'
  - 'create module'
  - 'generate module'
---

# 模块生成器

生成遵循六边形架构的完整 NestJS 业务模块。

## 输入

- **模块名称**：如 `products`（复数形式）
- **所属目录**：`src/modules/`（业务模块）或 `src/core/`（核心模块）
- **主要字段**：至少需要知道核心业务字段

## 生成文件清单

```
src/modules/{name}/
├── domain/{singular}.ts                                    # Domain Entity
├── dto/
│   ├── create-{singular}.dto.ts                           # 创建 DTO
│   ├── update-{singular}.dto.ts                           # 更新 DTO（PartialType）
│   └── query-{singular}.dto.ts                            # 查询 DTO（继承分页）
├── infrastructure/persistence/
│   ├── {singular}.repository.ts                           # Repository Port
│   └── relational/
│       ├── entities/{singular}.entity.ts                  # TypeORM Entity
│       ├── mappers/{singular}.mapper.ts                   # Mapper
│       ├── repositories/{singular}.repository.ts          # Repository 实现
│       └── relational-persistence.module.ts               # 持久化模块
├── {name}.controller.ts                                    # Controller
├── {name}.service.ts                                       # Service
└── {name}.module.ts                                        # Module
```

## 生成规范

1. **Domain Entity**：纯业务属性 + `@ApiProperty` + `@Exclude`/`@Expose`
2. **Persistence Entity**：TypeORM 装饰器 + `extends EntityRelationalHelper` + `@CreateDateColumn` + `@UpdateDateColumn` + `@DeleteDateColumn`
3. **Mapper**：静态方法 `toDomain()` / `toPersistence()`
4. **Repository Port**：抽象类，定义 `create/findById/findManyWithPagination/update/remove`
5. **Repository 实现**：注入 TypeORM Repository，所有操作经过 Mapper 转换
6. **DTO**：class-validator 验证 + `@ApiProperty` Swagger 文档
7. **Service**：注入抽象 Repository，包含业务逻辑
8. **Controller**：版本 v1，JWT Guard，完整 CRUD + Swagger 装饰器
9. **Module**：imports PersistenceModule，exports Service + PersistenceModule

## 后续步骤

生成后需要手动完成：

1. 在 `AppModule` 中注册新模块
2. 生成 Migration：`pnpm migration:generate -- src/infrastructure/database/migrations/{Name}`
3. 执行 Migration：`pnpm migration:run`
4. 如需权限控制，在 `Permission` 枚举中添加权限

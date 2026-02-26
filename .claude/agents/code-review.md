# 代码审查清单

> 依赖：[coding-standards](./coding-standards.md)

## 架构层面

- [ ] **六边形架构合规**：Domain 无 TypeORM 依赖，Service 依赖抽象 Repository
- [ ] **Mapper 完整**：toDomain() 和 toPersistence() 双向映射无遗漏字段
- [ ] **模块封装**：不直接引用其他模块的内部文件，通过 Module exports 暴露
- [ ] **Controller 薄层**：仅路由转发，无业务逻辑

## 安全层面

- [ ] **认证保护**：需要登录的端点使用 `@UseGuards(AuthGuard('jwt'))`
- [ ] **权限控制**：管理端点使用 `@RequirePermissions()` 或 `@Roles()`
- [ ] **DTO 验证**：所有外部输入通过 class-validator 验证
- [ ] **敏感数据**：密码等字段在 Domain Entity 中用 `@Exclude()` 排除
- [ ] **SQL 注入**：使用 TypeORM 参数化查询，不拼接 SQL
- [ ] **配置安全**：不使用 `process.env`，使用 ConfigService

## 数据库层面

- [ ] **Migration**：Entity 变更后生成了 Migration
- [ ] **软删除**：使用 `softDelete` 而非 `delete`
- [ ] **索引**：频繁查询字段添加了 `@Index()`
- [ ] **关联**：eager loading 适当使用，避免 N+1 查询
- [ ] **事务**：多表操作使用 TransactionService

## 代码质量

- [ ] **类型安全**：无 `any`，使用明确类型
- [ ] **错误处理**：使用 NestJS 内置异常（HttpException 子类）
- [ ] **日志**：关键操作有日志记录，敏感信息已脱敏
- [ ] **命名规范**：文件 kebab-case，类 PascalCase，符合 NestJS 约定
- [ ] **ConfigService**：使用 `{ infer: true }` 参数

## Swagger 文档

- [ ] **ApiTags**：Controller 有 `@ApiTags()` 分组
- [ ] **ApiProperty**：DTO 字段有 `@ApiProperty()` 装饰
- [ ] **ApiResponse**：端点有对应的 Response 装饰器
- [ ] **ApiBearerAuth**：需认证的 Controller 有标注

## 测试

- [ ] **单元测试**：Service 核心逻辑有单元测试
- [ ] **E2E 测试**：关键 API 端点有 E2E 测试
- [ ] **Mock**：测试正确 mock 了外部依赖

## 性能

- [ ] **分页**：列表接口使用分页（skip/take）
- [ ] **缓存**：频繁读取的数据考虑缓存
- [ ] **N+1**：检查关联查询是否有 N+1 问题
- [ ] **异步**：耗时操作使用队列异步处理

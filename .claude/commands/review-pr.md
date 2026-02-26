# PR 审查清单

> 完整规范参考：`.claude/agents/code-review.md`

请按以下清单逐项检查本次 PR 的代码变更：

## 架构合规

- [ ] Domain 无 TypeORM 依赖，Service 依赖抽象 Repository Port
- [ ] Mapper 双向映射完整，Controller 仅做路由转发
- [ ] 模块间通过 Module exports 通信

## 安全

- [ ] 认证端点使用 Guard，敏感操作有 `@RequirePermissions()`
- [ ] 外部输入通过 DTO class-validator 验证
- [ ] 不使用 `process.env`，敏感字段 `@Exclude()`

## 数据库

- [ ] Entity 变更有 Migration，已提交的 Migration 未被修改
- [ ] 软删除使用 `softDelete`，频繁查询字段有索引

## 代码质量

- [ ] 无 `any`，使用 NestJS 内置异常，ESLint + TypeScript 通过

## 文档 & 测试

- [ ] DTO 有 `@ApiProperty`，端点有 `@ApiResponse`
- [ ] Service 核心逻辑有单元测试，关键 API 有 E2E 测试

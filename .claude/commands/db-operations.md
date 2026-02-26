# 数据库操作速查

> 完整规范参考：`.claude/agents/database-development.md`

## 常用命令

```bash
# Migration
pnpm migration:generate -- src/infrastructure/database/migrations/描述名称
pnpm migration:create -- src/infrastructure/database/migrations/描述名称
pnpm migration:run
pnpm migration:revert

# 种子数据
pnpm seed:run:relational     # 开发环境
pnpm seed:run:prod           # 生产环境

# 代码生成
pnpm generate:resource:relational    # 生成完整资源模块
pnpm add:property:to-relational      # 添加属性
```

## 规则提醒

1. **禁止修改已提交的 Migration**
2. **禁止生产环境 `synchronize: true`**
3. **使用 `softDelete` 替代 `delete`**
4. **频繁查询字段添加 `@Index()`**
5. **多表操作使用事务**

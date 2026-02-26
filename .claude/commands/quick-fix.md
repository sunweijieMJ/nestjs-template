# 快速问题修复索引

## 常见错误与解决方案

### TypeORM 相关

| 错误                                        | 解决方案                                           |
| ------------------------------------------- | -------------------------------------------------- |
| `EntityMetadataNotFoundError`               | Entity 未注册到 `TypeOrmModule.forFeature()`       |
| `QueryFailedError: relation does not exist` | 未执行 migration：`pnpm migration:run`             |
| `No repository was found`                   | PersistenceModule 未 import 到 Module              |
| Migration 执行失败                          | 检查 SQL 语法，必要时 `pnpm migration:revert` 回滚 |

### NestJS 相关

| 错误                                   | 解决方案                                         |
| -------------------------------------- | ------------------------------------------------ |
| `Nest can't resolve dependencies`      | 检查 Module imports 和 providers，确保依赖已导出 |
| `Cannot determine a type for property` | DTO 属性缺少类型装饰器，添加 `@IsString()` 等    |
| `Unknown authentication strategy`      | AuthModule 未导入或 Strategy 未注册              |
| 循环依赖                               | 使用 `forwardRef(() => XxxModule)`               |

### 运行时相关

| 错误                | 解决方案                          |
| ------------------- | --------------------------------- |
| 端口被占用          | `lsof -ti:3000 \| xargs kill`     |
| Redis 连接失败      | 检查 Redis 服务：`redis-cli ping` |
| PostgreSQL 连接失败 | 检查 `.env` 数据库配置和服务状态  |
| Docker 容器启动失败 | `make clean && make dev` 清理重建 |

### ESLint / TypeScript

| 错误          | 解决方案                       |
| ------------- | ------------------------------ |
| 类型检查失败  | `pnpm type-check` 查看具体错误 |
| ESLint 错误   | `pnpm lint:fix` 自动修复       |
| Prettier 冲突 | `pnpm format` 重新格式化       |

## 快速诊断命令

```bash
pnpm lint           # 代码质量检查
pnpm type-check     # 类型检查
pnpm test           # 运行测试
pnpm migration:run  # 执行待处理迁移
make dev               # 重启开发环境
```

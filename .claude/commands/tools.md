# 工具索引

## 开发命令

| 命令               | 说明                                |
| ------------------ | ----------------------------------- |
| `pnpm start:swc`   | 开发服务器（SWC 快速编译 + 热重载） |
| `pnpm start:dev`   | 开发服务器（标准编译）              |
| `pnpm start:debug` | 调试模式                            |
| `pnpm build`       | 生产构建                            |
| `pnpm start:prod`  | 运行生产版本                        |

## 代码质量

| 命令              | 说明                |
| ----------------- | ------------------- |
| `pnpm lint`       | ESLint 检查         |
| `pnpm lint:fix`   | ESLint 自动修复     |
| `pnpm type-check` | TypeScript 类型检查 |
| `pnpm format`     | Prettier 格式化     |
| `pnpm cspell`     | 拼写检查            |

## 测试

| 命令              | 说明       |
| ----------------- | ---------- |
| `pnpm test`       | 单元测试   |
| `pnpm test:watch` | 监听模式   |
| `pnpm test:cov`   | 覆盖率报告 |
| `pnpm test:e2e`   | E2E 测试   |

## 数据库

| 命令                       | 说明         |
| -------------------------- | ------------ |
| `pnpm migration:generate`  | 生成迁移     |
| `pnpm migration:run`       | 执行迁移     |
| `pnpm migration:revert`    | 回滚迁移     |
| `pnpm seed:run:relational` | 执行种子数据 |

## 代码生成

| 命令                                | 说明         |
| ----------------------------------- | ------------ |
| `pnpm generate:resource:relational` | 生成资源模块 |
| `pnpm add:property:to-relational`   | 添加模块属性 |

## Docker

| 命令         | 说明             |
| ------------ | ---------------- |
| `make dev`   | 启动开发环境     |
| `make test`  | 启动测试环境     |
| `make ci`    | CI 测试          |
| `make down`  | 停止容器         |
| `make clean` | 清理容器和数据卷 |

## Git

| 命令          | 说明                     |
| ------------- | ------------------------ |
| `pnpm commit` | 交互式提交（commitizen） |

## 访问地址（开发环境）

| 地址                              | 说明            |
| --------------------------------- | --------------- |
| `http://localhost:3000/api/v1`    | API 根路径      |
| `http://localhost:3000/docs`      | Swagger UI      |
| `http://localhost:3000/docs-json` | OpenAPI JSON    |
| `http://localhost:3000/health`    | 健康检查        |
| `http://localhost:3000/metrics`   | Prometheus 指标 |

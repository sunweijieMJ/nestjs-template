> 本文档专为 AI 助手设计，提供项目快速概览和文档导航。人类开发者请查看 [README.md](README.md)

## Git 提交规则

- **提交格式**: `type: subject` 或 `type(scope): subject`
- **语言**: commit subject 推荐使用中文
- **示例**: `feat: 添加用户登录功能` 或 `fix(auth): 修复登录验证问题`
- **AI 标识**: 提交代码时不要添加 Co-Authored-By 签名，改为在 commit 末尾添加：🤖 Generated with AI

---

## 核心架构决策

### 1. 六边形架构（Hexagonal Architecture）

每个业务模块采用严格的分层结构：

```
module/
├── domain/               # 纯业务实体（无框架依赖）
│   └── entity.ts
├── dto/                  # 数据传输对象（class-validator 验证）
├── infrastructure/
│   └── persistence/
│       ├── port.repository.ts          # 仓储接口（抽象类）
│       └── relational/
│           ├── entities/               # TypeORM 数据库实体
│           ├── mappers/                # Domain ↔ Entity 双向映射
│           ├── repositories/           # 仓储实现
│           └── relational-persistence.module.ts
├── controller.ts         # HTTP 适配器（薄层，仅路由）
├── service.ts            # 业务逻辑编排
└── module.ts             # NestJS 模块定义
```

**核心原则**：Service 依赖抽象 Repository Port，不依赖具体实现；Domain 实体不包含任何框架装饰器。

### 2. TypeORM 持久化模式

- **Domain Entity**：纯业务对象，使用 `class-transformer` 控制序列化（`@Exclude`, `@Expose`）
- **Persistence Entity**：TypeORM 装饰器（`@Entity`, `@Column`, `@ManyToOne` 等）
- **Mapper**：静态方法 `toDomain()` / `toPersistence()` 双向转换
- **Repository Port**：抽象类定义接口，通过 Module 的 `provide/useClass` 绑定实现
- **Migration**：通过 `pnpm migration:generate` 自动生成，手动审查后提交

### 3. 类型安全配置系统

```
src/config/config.type.ts          → AllConfigType（聚合所有配置类型）
src/config/app.config.ts           → registerAs('app', () => ({...}))
src/xxx/config/xxx.config.ts       → registerAs('xxx', () => ({...}))
src/xxx/config/xxx-config.type.ts  → 配置类型接口
```

**使用方式**：`configService.get('auth.secret', { infer: true })` — 必须传 `{ infer: true }`

### 4. 统一响应格式

- **ResponseInterceptor**：所有成功响应包装为 `{ code: 200, message: 'success', data }`
- **AllExceptionsFilter**：所有异常包装为 `{ code: statusCode, message, data: errors }`
- **跳过包装**：使用 `@SkipResponseTransform()` 装饰器
- **国际化**：错误消息通过 `nestjs-i18n` 自动翻译

### 5. 认证授权体系

- **JWT 双令牌**：Access Token（15m）+ Refresh Token（3650d）
- **多登录方式**：邮箱密码、手机密码、手机短信验证码、微信
- **RBAC 权限**：`@UseGuards(AuthGuard('jwt'), PermissionsGuard)` + `@RequirePermissions(Permission.XXX)`
- **Session 管理**：支持多设备登录，按设备追踪会话

---

## 禁止事项

| 禁止操作                              | 后果                         |
| ------------------------------------- | ---------------------------- |
| Domain 实体中引入 TypeORM 装饰器      | 破坏领域层独立性             |
| 跳过 Mapper 直接转换 Entity/Domain    | 架构层级泄漏                 |
| 硬编码配置值（端口、密钥等）          | 必须使用 ConfigService       |
| Controller 中编写业务逻辑             | 违反单一职责，应放在 Service |
| 手动修改已提交的 Migration 文件       | 导致数据库状态不一致         |
| 跳过 DTO class-validator 验证         | 安全漏洞                     |
| Service 直接依赖具体 Repository 实现  | 违反依赖倒置原则             |
| 在 Service 中直接使用 `process.env`   | 绕过类型安全配置系统         |
| 同步操作数据库（`synchronize: true`） | 生产环境数据丢失风险         |
| 跨模块直接引用其他模块的内部文件      | 应通过 Module exports 暴露   |

---

## 目录速查

| 目录                  | 职责         | 说明                                                                                |
| --------------------- | ------------ | ----------------------------------------------------------------------------------- |
| `src/core/`           | 核心业务     | auth, users, session, permissions                                                   |
| `src/modules/`        | 业务模块     | addresses, orders, files, notifications 等                                          |
| `src/common/`         | 共享工具     | decorators, dto, filters, interceptors, validators, utils                           |
| `src/config/`         | 应用配置     | AllConfigType 聚合 + app.config                                                     |
| `src/infrastructure/` | 基础设施     | database, cache, queue, redis, logger, health, metrics, audit, throttler, scheduler |
| `src/integrations/`   | 外部集成     | mail, sms, wechat, alipay                                                           |
| `src/i18n/`           | 国际化       | en/, zh/ 翻译文件                                                                   |
| `test/`               | E2E 测试     | supertest + jest-e2e                                                                |
| `docker/`             | Docker 配置  | compose 文件 + Makefile                                                             |
| `.hygen/`             | 代码生成模版 | hygen 模版文件                                                                      |

---

## 常用命令

```bash
pnpm start:swc             # 开发服务器（SWC 快速编译）
pnpm build                 # 生产构建
pnpm lint                  # ESLint 检查
pnpm lint:fix              # ESLint 自动修复
pnpm type-check            # TypeScript 类型检查
pnpm format                # Prettier 格式化
pnpm test                  # 单元测试
pnpm test:e2e              # E2E 测试
pnpm migration:generate    # 生成数据库迁移
pnpm migration:run         # 执行迁移
pnpm seed:run:relational   # 执行数据库种子
pnpm commit                # 交互式提交（commitizen）
make -C docker dev         # Docker 开发环境（Makefile 在 docker/ 目录）
make -C docker ci          # Docker CI 环境
```

---

## Agent 导航

开发前请参考对应 Agent 了解规范：

| Agent                                                          | 职责          | 适用场景                      |
| -------------------------------------------------------------- | ------------- | ----------------------------- |
| [common-patterns](.claude/agents/common-patterns.md)           | 通用模式 SSoT | 所有开发的基础参考            |
| [module-development](.claude/agents/module-development.md)     | 模块开发规范  | 新建/修改业务模块             |
| [database-development](.claude/agents/database-development.md) | 数据库开发    | Entity, Migration, Repository |
| [api-development](.claude/agents/api-development.md)           | API 端点开发  | Controller, DTO, Swagger      |
| [auth-development](.claude/agents/auth-development.md)         | 认证授权      | JWT, RBAC, Guards             |
| [infrastructure](.claude/agents/infrastructure.md)             | 基础设施      | Cache, Queue, Redis, Logger   |
| [config-development](.claude/agents/config-development.md)     | 配置开发      | 新增配置模块                  |
| [coding-standards](.claude/agents/coding-standards.md)         | 编码规范      | TypeScript/NestJS 标准        |
| [code-review](.claude/agents/code-review.md)                   | 代码审查      | PR 审查清单                   |
| [testing](.claude/agents/testing.md)                           | 测试策略      | 单元测试 + E2E                |
| [project-structure](.claude/agents/project-structure.md)       | 项目结构      | 目录组织规范                  |
| [deployment](.claude/agents/deployment.md)                     | 部署流程      | Docker, CI/CD, 生产部署       |

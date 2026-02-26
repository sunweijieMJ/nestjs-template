# 项目结构规范

> 依赖：[common-patterns](./common-patterns.md)

## 顶层目录

```
nestjs-boilerplate/
├── src/                    # 源代码
│   ├── main.ts             # 应用入口（Bootstrap）
│   ├── app.module.ts       # 根模块
│   ├── config/             # 全局配置
│   ├── common/             # 共享工具
│   ├── core/               # 核心业务模块
│   ├── modules/            # 业务功能模块
│   ├── infrastructure/     # 基础设施
│   ├── integrations/       # 外部集成
│   └── i18n/               # 国际化翻译
├── test/                   # E2E 测试
├── docker/                 # Docker 配置
├── docs/                   # 项目文档
├── .claude/                # Claude AI 配置
├── .github/workflows/      # CI/CD
├── .husky/                 # Git Hooks
└── .hygen/                 # 代码生成模版
```

## 源码分层

### `src/config/` — 全局配置

```
config/
├── config.type.ts          # AllConfigType 聚合类型
└── app.config.ts           # 应用基础配置（port, prefix, env）
```

### `src/common/` — 共享工具

```
common/
├── constants/              # 全局常量
├── decorators/             # 自定义装饰器（@SkipResponseTransform 等）
├── dto/                    # 通用 DTO（ApiResponse, Pagination）
├── enums/                  # 通用枚举（Roles, Status）
├── filters/                # 全局异常过滤器
├── interceptors/           # 全局拦截器
├── middleware/             # 全局中间件
├── transformers/           # 数据转换器
├── types/                  # 工具类型（NullableType, DeepPartial）
├── utils/                  # 工具函数
└── validators/             # 自定义 class-validator
```

### `src/core/` — 核心模块

```
core/
├── auth/                   # 认证模块
│   ├── strategies/         # Passport 策略（JWT, Refresh）
│   ├── services/           # Token 服务
│   ├── helpers/            # 验证辅助函数
│   ├── dto/                # 认证 DTO
│   └── config/             # 认证配置
├── users/                  # 用户管理
│   ├── domain/             # User 领域实体
│   ├── dto/                # 用户 DTO
│   └── infrastructure/     # 持久化层
├── session/                # 会话管理
└── permissions/            # RBAC 权限
```

### `src/modules/` — 业务模块

已有模块：addresses, config, favorites, feedbacks, files, home, notifications, orders, regions, shares

每个模块遵循六边形架构：

```
modules/feature/
├── domain/feature.ts
├── dto/
├── infrastructure/persistence/
│   ├── feature.repository.ts          # Port（抽象类）
│   └── relational/
│       ├── entities/
│       ├── mappers/
│       ├── repositories/
│       └── relational-persistence.module.ts
├── feature.controller.ts
├── feature.service.ts
└── feature.module.ts
```

### `src/infrastructure/` — 基础设施

```
infrastructure/
├── database/
│   ├── data-source.ts              # TypeORM DataSource（CLI 用）
│   ├── data-source.factory.ts      # DataSource 工厂
│   ├── typeorm-config.service.ts   # TypeORM 配置服务
│   ├── config/                     # 数据库配置
│   ├── migrations/                 # 迁移文件
│   ├── seeds/                      # 种子数据
│   └── transaction/                # 事务管理
├── cache/                          # 缓存模块
├── queue/                          # BullMQ 队列
│   ├── mail-queue/                 # 邮件队列
│   └── notification-queue/         # 通知队列
├── redis/                          # Redis 配置
├── logger/                         # Pino 日志
├── health/                         # 健康检查
├── metrics/                        # Prometheus
├── audit/                          # 审计日志
├── throttler/                      # 限流
└── scheduler/                      # 定时任务
```

### `src/integrations/` — 外部集成

```
integrations/
├── mail/                   # 邮件（Nodemailer）
│   ├── mail-templates/     # 邮件模版
│   └── config/
├── sms/                    # 短信（阿里云）
│   ├── providers/
│   └── config/
├── wechat/                 # 微信支付
└── alipay/                 # 支付宝
```

## 文件引用规则

### 路径别名

- `@/*` → `src/*`
- `@config/*` → `src/config/*`

### 引用原则

1. **跨模块引用**：通过 Module imports + Service 注入
2. **同模块引用**：使用相对路径
3. **共享工具**：使用 `@/common/` 路径别名
4. **配置引用**：使用 `@/config/` 或 `@config/`

### 禁止引用

- 不直接引用其他模块的 Entity/Mapper/Repository 实现
- 不跨模块引用 `infrastructure/persistence/` 内部文件
- 不直接引用 `node_modules` 的内部路径

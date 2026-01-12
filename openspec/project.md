# Project Context

## Purpose

NestJS Boilerplate - 一个生产级别的 NestJS 后端项目模板，提供用户认证、文件上传、邮件服务等常用功能，使用 PostgreSQL 数据库。

## Tech Stack

- **Runtime**: Node.js >= 22
- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.x
- **Package Manager**: pnpm >= 9
- **Database**: PostgreSQL (TypeORM)
- **Cache/Queue**: Redis, BullMQ
- **Authentication**: JWT + Passport
- **API Documentation**: Swagger/OpenAPI
- **Containerization**: Docker / Docker Compose
- **Logging**: Pino

## Project Conventions

### Code Style

- ESLint + Prettier 强制代码风格
- 文件命名: `kebab-case` (如 `user.service.ts`)
- 类命名: `PascalCase` (如 `UserService`)
- 接口/类型: 以 `.type.ts`, `.interface.ts` 或 `.dto.ts` 结尾
- 使用 `class-validator` 进行 DTO 验证
- 使用 `class-transformer` 进行序列化

### Architecture Patterns

采用**六边形架构 (Hexagonal Architecture)**:

```
module/
├── domain/              # 领域实体 (纯业务逻辑，无依赖)
├── dto/                 # 数据传输对象
├── infrastructure/      # 基础设施层
│   └── persistence/
│       ├── [port].repository.ts      # 仓储接口 (Port)
│       └── relational/               # PostgreSQL 实现 (Adapter)
│           ├── entities/
│           ├── mappers/
│           └── repositories/
├── module.ts
├── controller.ts
└── service.ts
```

关键原则:

- Domain 实体不依赖数据库
- 使用 Mapper 在 Domain ↔ Entity 之间转换
- Repository 方法单一职责，避免通用查询方法

### Testing Strategy

- **单元测试**: Jest (`npm run test`)
- **E2E 测试**: Jest + Supertest (`npm run test:e2e`)
- **覆盖率阈值**: 60% (branches, functions, lines, statements)
- 测试文件: `*.spec.ts` (单元), `*.e2e-spec.ts` (E2E)

### Git Workflow

- **Commit Convention**: [Conventional Commits](https://www.conventionalcommits.org/)
  - `feat:` 新功能
  - `fix:` Bug 修复
  - `docs:` 文档
  - `refactor:` 重构
  - `test:` 测试
  - `chore:` 杂项
- **Hooks**: Husky + lint-staged (提交前自动 lint)
- **Release**: release-it + conventional-changelog

## Domain Context

### 核心模块

| 模块    | 路径          | 职责                                    |
| ------- | ------------- | --------------------------------------- |
| Auth    | `src/auth`    | JWT 认证、注册、登录、密码重置          |
| Users   | `src/users`   | 用户 CRUD、角色管理                     |
| Files   | `src/files`   | 文件上传 (Local/S3/S3-Presigned)        |
| Session | `src/session` | 会话管理、Token 刷新                    |
| Mail    | `src/mail`    | 邮件模板、发送服务                      |
| i18n    | `src/i18n`    | 多语言支持 (en, zh, ar, es, fr, hi, uk) |

### 用户角色

- `admin` - 管理员
- `user` - 普通用户

### 用户状态

- `active` - 激活
- `inactive` - 未激活

## Important Constraints

- Node.js 版本必须 >= 22
- 生产环境需配置 Redis
- 文件上传需配置存储方式 (Local/S3)
- 邮件服务需配置 SMTP 或邮件提供商

## External Dependencies

- **数据库**: PostgreSQL (自托管或云服务)
- **缓存/队列**: Redis
- **文件存储**: AWS S3 (可选，支持本地存储)
- **邮件**: SMTP 服务 (如 Maildev 用于开发)

## CLI Commands

### 开发

```bash
pnpm start:dev          # 开发模式
pnpm docker:pg:dev      # Docker PostgreSQL 开发环境
```

### 代码生成

```bash
pnpm generate:resource:relational   # 生成 PostgreSQL 资源
```

### 数据库

```bash
pnpm migration:generate src/database/migrations/MigrationName
pnpm migration:run
pnpm seed:run:relational
```

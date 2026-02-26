# Claude Code 配置说明

本项目采用 Claude Code 四层工具体系，为 AI 助手提供完整的开发辅助。

## 四层工具体系

| 层级         | 用途            | 触发方式            | 复杂度 |
| ------------ | --------------- | ------------------- | ------ |
| **Commands** | 快速提示/清单   | `/command-name`     | 简单   |
| **Skills**   | 代码生成/自动化 | Claude 自动发现     | 复杂   |
| **Agents**   | 深度指导/规范   | Claude 按需读取参考 | 深入   |
| **Hooks**    | 自动化规则      | 事件驱动            | 确定性 |

---

## Commands（命令）

快速参考清单，通过 `/command-name` 调用：

| 命令              | 说明                           |
| ----------------- | ------------------------------ |
| `/review-pr`      | PR 审查清单                    |
| `/git-workflow`   | Git 工作流规范                 |
| `/quick-fix`      | 快速问题修复索引               |
| `/security-check` | 安全检查清单（OWASP + NestJS） |
| `/db-operations`  | 数据库操作速查                 |
| `/tools`          | 工具索引                       |

---

## Skills（技能）

代码生成与自动化工具，Claude 根据上下文自动发现并使用：

### 开发辅助

| 技能                          | 说明                                          |
| ----------------------------- | --------------------------------------------- |
| `module-generator`            | 生成完整业务模块（六边形架构）                |
| `entity-generator`            | 生成 Entity + Mapper + Repository + Migration |
| `api-endpoint-generator`      | 生成 REST 端点（Controller + DTO + Swagger）  |
| `guard-interceptor-generator` | 生成 Guard / Interceptor / Pipe               |
| `config-generator`            | 生成类型安全配置模块                          |

### 质量保障

| 技能             | 说明                                           |
| ---------------- | ---------------------------------------------- |
| `test-generator` | 生成单元测试 + E2E 测试                        |
| `code-optimizer` | 六维优化（性能/安全/可读性/DRY/复杂度/覆盖率） |

---

## Agents（代理）

深度开发指导文档，位于 `.claude/agents/` 目录。Claude 在开发时按需读取对应文档作为上下文参考。

**使用方式**：在对话中提及相关开发场景时，Claude 会自动读取对应的 Agent 文档；也可以主动要求"参考 xxx-development agent"来加载规范。

### 核心 Agents

| Agent                  | 职责                                     |
| ---------------------- | ---------------------------------------- |
| `common-patterns`      | 通用模式 SSoT（所有 Agent 的基础）       |
| `module-development`   | NestJS 模块开发（六边形架构）            |
| `database-development` | TypeORM Entity / Migration / Repository  |
| `api-development`      | Controller / DTO / Swagger 端点开发      |
| `auth-development`     | JWT 认证 / RBAC 权限 / Guards            |
| `infrastructure`       | Cache / Queue / Redis / Logger / Metrics |
| `config-development`   | 类型安全配置模块开发                     |

### 专业 Agents

| Agent               | 职责                         |
| ------------------- | ---------------------------- |
| `coding-standards`  | TypeScript / NestJS 编码规范 |
| `code-review`       | 代码审查清单                 |
| `testing`           | Jest 单元测试 + E2E 测试策略 |
| `project-structure` | 目录组织规范                 |
| `deployment`        | Docker / CI-CD / 生产部署    |

### Agent 依赖关系

```text
common-patterns (SSoT)
├── module-development
│   └── database-development
├── api-development
│   └── auth-development
├── coding-standards
│   └── code-review
├── infrastructure
│   └── config-development
├── testing
└── deployment
```

---

## Hooks（自动化规则）

事件驱动的自动化保护：

| Hook                      | 触发时机        | 作用                               |
| ------------------------- | --------------- | ---------------------------------- |
| `PreToolUse(Write\|Edit)` | 写入/编辑文件前 | 阻止修改已提交的 Migration 文件    |
| `SessionStart`            | 会话开始        | 显示分支、未提交文件、架构规范提醒 |
| `UserPromptSubmit`        | 用户提交提示    | 显示 git status                    |

---

## 标准开发工作流

```text
1. 查阅 CLAUDE.md → 了解架构决策和禁止项
2. 参考 Agent → 学习对应领域规范
3. 使用 Skill → 自动生成代码骨架
4. 遵循 Hook → 自动合规检查
5. pnpm lint && pnpm type-check → 代码质量
6. pnpm test → 单元测试
7. pnpm commit → 交互式提交
```

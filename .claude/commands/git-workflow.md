# Git 工作流规范

## 分支策略

| 分支        | 用途             | 保护          |
| ----------- | ---------------- | ------------- |
| `master`    | 主分支，生产就绪 | 受保护，需 PR |
| `release/*` | 发布分支         | CI 自动部署   |
| `feat/*`    | 功能开发         | 合并到 master |
| `fix/*`     | 问题修复         | 合并到 master |

## 提交规范

格式：`type(scope): subject`

### Type

| Type       | 说明                   |
| ---------- | ---------------------- |
| `feat`     | 新功能                 |
| `fix`      | 修复 Bug               |
| `docs`     | 文档变更               |
| `style`    | 代码风格（不影响功能） |
| `refactor` | 重构                   |
| `perf`     | 性能优化               |
| `test`     | 测试相关               |
| `build`    | 构建系统               |
| `ci`       | CI/CD                  |
| `chore`    | 其他杂项               |

### 规则

- Subject 推荐使用中文
- 长度不超过 72 字符
- AI 生成的提交末尾添加：🤖 Generated with AI
- 使用 `pnpm commit` 交互式提交

## Pre-commit Hooks

自动执行：

1. lint-staged（ESLint + Prettier）
2. TypeScript 类型检查
3. 单元测试
4. Commitlint（提交消息格式）

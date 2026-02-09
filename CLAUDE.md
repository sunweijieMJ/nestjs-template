<!-- OPENSPEC:START -->

# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:

- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:

- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

> 本文档专为 AI 助手设计，提供项目快速概览和文档导航。人类开发者请查看 [README.md](README.md)

## Git 提交规则

- **提交格式**: `type: subject` 或 `type(scope): subject`
- **语言**: commit subject 推荐使用中文
- **示例**: `feat: 添加用户登录功能` 或 `fix(auth): 修复登录验证问题`
- **AI 标识**: 提交代码时不要添加 Co-Authored-By 签名，改为在 commit 末尾添加：🤖 Generated with AI

---

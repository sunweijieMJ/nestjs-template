# Mail Module Specification

## Purpose

邮件服务模块，提供事务性邮件发送功能。使用 Handlebars 作为模板引擎渲染 HTML 邮件，支持 i18n 多语言（en、zh、ar、es、fr、hi、uk）。目前支持三种邮件类型：注册确认邮件、密码重置邮件、新邮箱确认邮件。底层使用 nodemailer 发送，可配置任意 SMTP 服务。

## Requirements

### Requirement: Mail Service Architecture

系统 SHALL 采用两层架构：

- `MailService` - 业务层，处理邮件内容和模板
- `MailerService` - 底层发送服务，通过 nodemailer 发送邮件

#### Scenario: Mail sending flow
- **WHEN** 业务代码调用 MailService
- **THEN** MailService 准备邮件内容和模板
- **AND** 调用 MailerService 发送邮件

---

### Requirement: User Sign Up Email

系统 SHALL 在用户注册后发送确认邮件。

#### Scenario: Send signup confirmation
- **WHEN** 用户注册成功
- **THEN** 发送邮件到用户邮箱
- **AND** 邮件包含确认链接（包含 hash 参数）
- **AND** 使用 `activation.hbs` 模板

#### Scenario: I18n support
- **WHEN** 发送注册确认邮件
- **THEN** 邮件内容使用当前 i18n 语言
- **AND** 从 `confirm-email.json` 获取翻译文本

---

### Requirement: Forgot Password Email

系统 SHALL 在用户请求密码重置时发送重置邮件。

#### Scenario: Send password reset email
- **WHEN** 用户请求重置密码
- **THEN** 发送邮件到用户邮箱
- **AND** 邮件包含重置链接（包含 hash 和 expires 参数）
- **AND** 使用 `reset-password.hbs` 模板

#### Scenario: I18n support
- **WHEN** 发送密码重置邮件
- **THEN** 邮件内容使用当前 i18n 语言
- **AND** 从 `reset-password.json` 获取翻译文本

---

### Requirement: Confirm New Email

系统 SHALL 在用户更换邮箱时发送确认邮件到新地址。

#### Scenario: Send new email confirmation
- **WHEN** 用户请求更换邮箱
- **THEN** 发送邮件到新邮箱地址
- **AND** 邮件包含确认链接（包含 hash 参数）
- **AND** 使用 `confirm-new-email.hbs` 模板

#### Scenario: I18n support
- **WHEN** 发送新邮箱确认邮件
- **THEN** 邮件内容使用当前 i18n 语言
- **AND** 从 `confirm-new-email.json` 获取翻译文本

---

### Requirement: Email Templates

系统 SHALL 使用 Handlebars 模板引擎渲染邮件。

模板位置: `src/mail/mail-templates/`

| 模板文件 | 用途 |
|---------|------|
| activation.hbs | 注册确认邮件 |
| reset-password.hbs | 密码重置邮件 |
| confirm-new-email.hbs | 新邮箱确认邮件 |

#### Scenario: Template rendering
- **WHEN** 发送邮件
- **THEN** 使用 Handlebars 渲染模板
- **AND** 注入 context 变量（title, url, actionTitle, app_name, text1-4 等）

---

### Requirement: I18n Support

系统 SHALL 支持多语言邮件内容。

支持的语言: en, zh, ar, es, fr, hi, uk

#### Scenario: Language detection
- **WHEN** 发送邮件
- **THEN** 从 I18nContext 获取当前语言
- **AND** 使用对应语言的翻译文件

#### Scenario: Fallback language
- **WHEN** 当前语言翻译不存在
- **THEN** 使用默认语言 (en)

---

### Requirement: Email Configuration

系统 SHALL 从配置中读取邮件相关设置。

| 配置项 | 说明 |
|--------|------|
| app.frontendDomain | 前端域名，用于生成确认链接 |
| app.name | 应用名称，显示在邮件中 |
| app.workingDirectory | 工作目录，用于定位模板文件 |

#### Scenario: Generate confirmation URL
- **WHEN** 生成确认链接
- **THEN** URL 格式为 `{frontendDomain}/confirm-email?hash={hash}`

#### Scenario: Generate password reset URL
- **WHEN** 生成密码重置链接
- **THEN** URL 格式为 `{frontendDomain}/password-change?hash={hash}&expires={timestamp}`

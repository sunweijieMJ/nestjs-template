# SMS Module Specification

## Purpose

短信服务模块，提供短信验证码的发送、验证和生命周期管理功能。支持多种验证码类型（登录、注册、重置密码、更换手机号），采用阿里云短信服务作为底层提供商。包含防刷机制（重发间隔限制）、验证码过期管理、最大尝试次数限制等安全特性。验证码存储在 Redis 缓存中，确保高性能和自动过期。

## Requirements

### Requirement: SMS Code Types

系统 SHALL 支持以下验证码类型：

- `login` - 登录验证码
- `register` - 注册验证码
- `reset_password` - 重置密码验证码
- `change_phone` - 更换手机号验证码

#### Scenario: Code type usage

- **WHEN** 业务模块请求发送验证码
- **THEN** 必须指定验证码类型
- **AND** 不同类型的验证码相互独立存储

---

### Requirement: Generate Verification Code

系统 SHALL 生成加密安全的随机验证码。

#### Scenario: Generate code

- **WHEN** 需要发送验证码
- **THEN** 使用 crypto.randomInt 生成随机数字
- **AND** 验证码长度从配置读取（默认 6 位）
- **AND** 验证码仅包含数字 0-9

---

### Requirement: Send Verification Code

系统 SHALL 允许发送短信验证码到指定手机号。

#### Scenario: Send code success

- **WHEN** 用户请求发送验证码
- **AND** 该手机号在重发间隔之外
- **THEN** 生成新的验证码
- **AND** 通过阿里云短信服务发送
- **AND** 将验证码存储到 Redis 缓存
- **AND** 设置过期时间（默认 300 秒）
- **AND** 返回成功消息

#### Scenario: Send code with rate limit

- **WHEN** 用户请求发送验证码
- **AND** 距离上次发送未超过重发间隔（默认 60 秒）
- **THEN** 拒绝发送
- **AND** 返回剩余等待秒数
- **AND** 返回错误消息 "Please wait before requesting a new code"

#### Scenario: Send code failure

- **WHEN** 阿里云短信服务发送失败
- **THEN** 记录错误日志
- **AND** 返回失败消息
- **AND** 不存储验证码到缓存

---

### Requirement: Verify Verification Code

系统 SHALL 允许验证用户输入的验证码。

#### Scenario: Verify code success

- **WHEN** 用户提供正确的验证码
- **AND** 验证码未过期
- **AND** 尝试次数未超过限制
- **THEN** 验证通过
- **AND** 从缓存中删除该验证码
- **AND** 返回成功消息

#### Scenario: Verify code with wrong code

- **WHEN** 用户提供错误的验证码
- **AND** 尝试次数未超过限制（默认 5 次）
- **THEN** 验证失败
- **AND** 增加尝试次数计数
- **AND** 更新缓存中的尝试次数
- **AND** 返回错误消息 "Invalid verification code"

#### Scenario: Verify code with max attempts exceeded

- **WHEN** 用户尝试次数已达到最大限制
- **THEN** 验证失败
- **AND** 从缓存中删除该验证码
- **AND** 返回错误消息 "Too many failed attempts, please request a new code"

#### Scenario: Verify expired code

- **WHEN** 验证码已过期或不存在
- **THEN** 验证失败
- **AND** 返回错误消息 "Verification code expired or not found"

---

### Requirement: Code Storage

系统 SHALL 使用 Redis 缓存存储验证码信息。

#### Scenario: Store code in cache

- **WHEN** 验证码发送成功
- **THEN** 存储以下信息到 Redis
- **AND** 缓存键格式为 `sms:code:{type}:{phone}`
- **AND** 存储内容包含：code（验证码）、attempts（尝试次数，初始为 0）、createdAt（创建时间戳）
- **AND** 设置 TTL 为验证码过期时间（默认 300 秒）

#### Scenario: Auto expiration

- **WHEN** 验证码超过过期时间
- **THEN** Redis 自动删除该验证码
- **AND** 用户无法再使用该验证码

---

### Requirement: Security Features

系统 SHALL 实现以下安全特性。

#### Scenario: Rate limiting

- **WHEN** 用户频繁请求验证码
- **THEN** 强制重发间隔（默认 60 秒）
- **AND** 防止短信轰炸攻击

#### Scenario: Attempt limiting

- **WHEN** 用户多次输入错误验证码
- **THEN** 限制最大尝试次数（默认 5 次）
- **AND** 超过限制后删除验证码
- **AND** 用户需要重新请求验证码

#### Scenario: Code expiration

- **WHEN** 验证码生成后
- **THEN** 设置过期时间（默认 300 秒）
- **AND** 过期后自动失效

#### Scenario: One-time use

- **WHEN** 验证码验证成功
- **THEN** 立即从缓存中删除
- **AND** 防止验证码重复使用

---

### Requirement: Configuration

系统 SHALL 从配置中读取短信服务相关设置。

| 配置项              | 默认值                | 说明                         |
| ------------------- | --------------------- | ---------------------------- |
| sms.codeLength      | 6                     | 验证码长度                   |
| sms.codeExpires     | 300                   | 验证码过期时间（秒）         |
| sms.resendInterval  | 60                    | 重发间隔（秒）               |
| sms.maxAttempts     | 5                     | 最大尝试次数                 |
| sms.accessKeyId     | -                     | 阿里云 AccessKey ID          |
| sms.accessKeySecret | -                     | 阿里云 AccessKey Secret      |
| sms.endpoint        | dysmsapi.aliyuncs.com | 阿里云短信服务端点           |
| sms.mockMode        | false                 | 模拟模式开关（开发环境使用） |

#### Scenario: Read configuration

- **WHEN** SMS 服务初始化
- **THEN** 从 ConfigService 读取配置
- **AND** 使用默认值作为后备

---

### Requirement: SMS Provider Integration

系统 SHALL 使用阿里云短信服务作为底层提供商。

#### Scenario: Send SMS via Aliyun

- **WHEN** 调用发送验证码
- **THEN** 通过 AliyunSmsProvider 发送短信
- **AND** 传递手机号和验证码参数
- **AND** 处理发送结果（成功/失败）

#### Scenario: Provider failure handling

- **WHEN** 阿里云短信服务返回错误
- **THEN** 记录详细错误日志
- **AND** 返回用户友好的错误消息
- **AND** 不影响系统稳定性

---

### Requirement: Utility Methods

系统 SHALL 提供以下辅助方法。

#### Scenario: Check active code

- **WHEN** 调用 hasActiveCode(phone, type)
- **THEN** 检查指定手机号和类型是否有活跃验证码
- **AND** 返回布尔值

#### Scenario: Delete code manually

- **WHEN** 调用 deleteCode(phone, type)
- **THEN** 从缓存中删除指定验证码
- **AND** 用于清理或取消操作

---

### Requirement: Logging

系统 SHALL 记录关键操作日志。

#### Scenario: Log code sent

- **WHEN** 验证码发送成功
- **THEN** 记录日志：手机号、验证码类型
- **AND** 不记录验证码内容（安全考虑）

#### Scenario: Log verification

- **WHEN** 验证码验证成功
- **THEN** 记录日志：手机号、验证码类型

#### Scenario: Log errors

- **WHEN** 发送或验证失败
- **THEN** 记录错误日志
- **AND** 包含失败原因

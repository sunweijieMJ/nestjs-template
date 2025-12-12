# Session Module Specification

## Purpose

会话管理模块，提供用户登录会话的存储、查询和生命周期管理功能。每次用户登录创建新会话，会话包含随机生成的 hash 值用于 Refresh Token 验证。支持单会话删除（登出）、批量删除（密码重置后强制下线）、排除删除（密码修改后保留当前会话）等场景。

## Requirements

### Requirement: Session Domain Entity

系统 SHALL 定义 Session 领域实体，包含以下属性：

| 属性 | 类型 | 说明 |
|------|------|------|
| id | number \| string | 主键 |
| user | User | 关联的用户 |
| hash | string | 会话哈希（用于 refresh token 验证） |
| createdAt | Date | 创建时间 |
| updatedAt | Date | 更新时间 |
| deletedAt | Date | 删除时间（软删除） |

#### Scenario: Session entity structure
- **WHEN** 用户登录成功
- **THEN** 创建新的 Session 记录
- **AND** 生成随机 hash 值

---

### Requirement: Create Session

系统 SHALL 在用户登录时创建新的会话。

#### Scenario: Create session on login
- **WHEN** 用户登录成功
- **THEN** 创建 Session 记录
- **AND** 关联当前用户
- **AND** 生成 SHA256 hash
- **AND** 返回 Session 实体

---

### Requirement: Find Session by ID

系统 SHALL 提供通过 ID 查询会话的功能。

#### Scenario: Find existing session
- **WHEN** 提供有效的 session ID
- **THEN** 返回对应的 Session 实体

#### Scenario: Find non-existent session
- **WHEN** 提供不存在的 session ID
- **THEN** 返回 null

---

### Requirement: Update Session

系统 SHALL 允许更新会话信息（如 hash）。

#### Scenario: Update session hash on refresh
- **WHEN** 用户刷新 token
- **THEN** 生成新的 hash
- **AND** 更新 Session 记录

---

### Requirement: Delete Session by ID

系统 SHALL 允许删除单个会话。

#### Scenario: Delete session on logout
- **WHEN** 用户登出
- **THEN** 删除当前 Session 记录

---

### Requirement: Delete Sessions by User ID

系统 SHALL 允许删除用户的所有会话。

#### Scenario: Delete all sessions on password reset
- **WHEN** 用户重置密码
- **THEN** 删除该用户的所有 Session 记录

---

### Requirement: Delete Sessions by User ID with Exclusion

系统 SHALL 允许删除用户的会话，但排除指定会话。

#### Scenario: Delete other sessions on password change
- **WHEN** 用户在已登录状态下修改密码
- **THEN** 删除该用户的其他所有 Session 记录
- **AND** 保留当前会话

---

### Requirement: Session Validation

系统 SHALL 在 refresh token 时验证会话有效性。

#### Scenario: Valid session
- **WHEN** refresh token 中的 sessionId 和 hash 与数据库匹配
- **THEN** 允许刷新 token

#### Scenario: Invalid session hash
- **WHEN** refresh token 中的 hash 与数据库不匹配
- **THEN** 拒绝刷新 token
- **AND** 返回 HTTP 401 Unauthorized

#### Scenario: Session not found
- **WHEN** refresh token 中的 sessionId 不存在
- **THEN** 拒绝刷新 token
- **AND** 返回 HTTP 401 Unauthorized

# Users Module Specification

## Purpose

用户管理模块，提供完整的用户 CRUD（创建、读取、更新、删除）操作接口。所有接口仅限管理员角色 (admin) 访问。支持分页查询、条件筛选和排序。用户数据包括基本信息、角色、状态、头像等。采用六边形架构，使用 PostgreSQL 数据库。

## Requirements

### Requirement: User Domain Entity

系统 SHALL 定义 User 领域实体，包含以下属性：

| 属性      | 类型             | 说明                             |
| --------- | ---------------- | -------------------------------- |
| id        | number           | 主键                             |
| email     | string \| null   | 邮箱地址（敏感字段）             |
| password  | string           | 密码哈希（序列化时排除）         |
| provider  | string           | 认证提供者 (email, google, etc.) |
| firstName | string \| null   | 名                               |
| lastName  | string \| null   | 姓                               |
| photo     | FileType \| null | 头像文件                         |
| role      | Role \| null     | 角色                             |
| status    | Status           | 状态                             |
| createdAt | Date             | 创建时间                         |
| updatedAt | Date             | 更新时间                         |
| deletedAt | Date             | 删除时间（软删除）               |

#### Scenario: Serialization groups

- **WHEN** 用户信息被序列化
- **THEN** `email` 和 `provider` 仅在 `me` 或 `admin` 组中可见
- **AND** `password` 在任何情况下都不可见

---

### Requirement: Admin Authorization

Users 模块的所有端点 SHALL 仅允许 `admin` 角色访问。

#### Scenario: Admin access

- **WHEN** admin 用户携带有效 JWT token 访问 /users 端点
- **THEN** 请求被允许

#### Scenario: Non-admin access denied

- **WHEN** 非 admin 用户访问 /users 端点
- **THEN** 返回 HTTP 403 Forbidden

---

### Requirement: Create User

系统 SHALL 允许管理员创建新用户。

#### Scenario: Create user success

- **WHEN** 管理员提供有效的用户信息（email, password, firstName, lastName, role, status）
- **THEN** 创建用户
- **AND** 密码使用 bcrypt 哈希存储
- **AND** 返回新创建的用户信息

#### Scenario: Create user with existing email

- **WHEN** 管理员提供已存在的 email
- **THEN** 返回 HTTP 422
- **AND** 错误信息为 `emailAlreadyExists`

#### Scenario: Create user with invalid role

- **WHEN** 管理员提供不存在的 role id
- **THEN** 返回 HTTP 422
- **AND** 错误信息为 `roleNotExists`

#### Scenario: Create user with invalid status

- **WHEN** 管理员提供不存在的 status id
- **THEN** 返回 HTTP 422
- **AND** 错误信息为 `statusNotExists`

#### Scenario: Create user with invalid photo

- **WHEN** 管理员提供不存在的 photo id
- **THEN** 返回 HTTP 422
- **AND** 错误信息为 `imageNotExists`

---

### Requirement: List Users with Pagination

系统 SHALL 允许管理员分页查询用户列表。

#### Scenario: List users success

- **WHEN** 管理员请求用户列表
- **THEN** 返回分页后的用户列表
- **AND** 默认 page=1, limit=10
- **AND** limit 最大值为 50

#### Scenario: List users with filters

- **WHEN** 管理员提供 filters 参数
- **THEN** 返回符合筛选条件的用户列表

#### Scenario: List users with sort

- **WHEN** 管理员提供 sort 参数
- **THEN** 返回按指定字段排序的用户列表

---

### Requirement: Get User by ID

系统 SHALL 允许管理员通过 ID 查询单个用户。

#### Scenario: Get user success

- **WHEN** 管理员提供有效的用户 ID
- **THEN** 返回该用户的详细信息

#### Scenario: Get non-existent user

- **WHEN** 管理员提供不存在的用户 ID
- **THEN** 返回 null

---

### Requirement: Update User

系统 SHALL 允许管理员更新用户信息。

#### Scenario: Update user success

- **WHEN** 管理员提供有效的更新信息
- **THEN** 更新用户信息
- **AND** 返回更新后的用户信息

#### Scenario: Update password

- **WHEN** 管理员更新用户密码
- **AND** 新密码与原密码不同
- **THEN** 新密码使用 bcrypt 哈希存储

#### Scenario: Update email to existing email

- **WHEN** 管理员将用户 email 更新为已存在的 email
- **THEN** 返回 HTTP 422
- **AND** 错误信息为 `emailAlreadyExists`

---

### Requirement: Delete User

系统 SHALL 允许管理员删除用户。

#### Scenario: Delete user success

- **WHEN** 管理员请求删除用户
- **THEN** 软删除该用户
- **AND** 返回 HTTP 204

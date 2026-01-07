# Auth Module Specification

## Purpose

用户认证模块，提供基于 JWT (JSON Web Token) 的完整身份认证功能。支持多种认证方式：邮箱认证、手机号认证、第三方登录（微信）。核心功能包括：用户注册与验证、密码登录、短信验证码登录、访问令牌刷新、密码忘记与重置、个人信息更新、账号登出与删除。采用 Access Token + Refresh Token 双令牌机制确保安全性。

## Requirements

### Requirement: Email Registration

系统 SHALL 允许用户通过邮箱注册账号。

- 新注册用户默认角色为 `user`
- 新注册用户默认状态为 `inactive`
- 注册后 SHALL 发送确认邮件

#### Scenario: Registration success

- **WHEN** 用户提供有效的 email、password、firstName、lastName
- **THEN** 系统创建用户账号
- **AND** 用户状态设置为 `inactive`
- **AND** 发送邮箱确认邮件
- **AND** 返回 HTTP 204

#### Scenario: Registration with existing email

- **WHEN** 用户提供已存在的 email
- **THEN** 返回 HTTP 422
- **AND** 错误信息为 `emailAlreadyExists`

---

### Requirement: Email Confirmation

系统 SHALL 允许用户通过邮件链接确认邮箱地址。

#### Scenario: Confirm email success

- **WHEN** 用户提供有效的确认 hash
- **THEN** 用户状态更新为 `active`
- **AND** 返回 HTTP 204

#### Scenario: Confirm email with invalid hash

- **WHEN** 用户提供无效或过期的 hash
- **THEN** 返回 HTTP 422
- **AND** 错误信息为 `invalidHash`

#### Scenario: Confirm email for already active user

- **WHEN** 用户已经是 active 状态
- **THEN** 返回 HTTP 404

---

### Requirement: Email Login

系统 SHALL 允许已激活的用户通过邮箱密码登录。

#### Scenario: Login success

- **WHEN** 用户提供正确的 email 和 password
- **AND** 用户 provider 为 `email`
- **THEN** 创建新的 Session
- **AND** 返回 JWT token、refresh token、token 过期时间和用户信息

#### Scenario: Login with non-existent email

- **WHEN** 用户提供不存在的 email
- **THEN** 返回 HTTP 422
- **AND** 错误信息为 `notFound`

#### Scenario: Login with wrong password

- **WHEN** 用户提供错误的 password
- **THEN** 返回 HTTP 422
- **AND** 错误信息为 `incorrectPassword`

#### Scenario: Login with wrong provider

- **WHEN** 用户的 provider 不是 `email`
- **THEN** 返回 HTTP 422
- **AND** 错误信息为 `needLoginViaProvider:{provider}`

---

### Requirement: Token Refresh

系统 SHALL 允许用户使用 refresh token 获取新的 access token。

#### Scenario: Refresh token success

- **WHEN** 用户提供有效的 refresh token
- **AND** Session 存在且 hash 匹配
- **THEN** 生成新的 token 和 refresh token
- **AND** 更新 Session hash
- **AND** 返回新的 token、refresh token 和过期时间

#### Scenario: Refresh with invalid session

- **WHEN** Session 不存在或 hash 不匹配
- **THEN** 返回 HTTP 401 Unauthorized

---

### Requirement: Get Current User

系统 SHALL 允许已认证用户获取自己的用户信息。

#### Scenario: Get me success

- **WHEN** 用户携带有效的 JWT token 请求 `/auth/me`
- **THEN** 返回当前用户信息
- **AND** 敏感字段（如 email）仅在 `me` 序列化组中可见

---

### Requirement: Update Current User

系统 SHALL 允许已认证用户更新自己的信息。

#### Scenario: Update profile success

- **WHEN** 用户更新 firstName、lastName 等基本信息
- **THEN** 更新用户信息
- **AND** 返回更新后的用户信息

#### Scenario: Update password

- **WHEN** 用户提供 oldPassword 和新 password
- **AND** oldPassword 正确
- **THEN** 更新密码
- **AND** 删除其他所有 Session（保留当前 Session）

#### Scenario: Update password with wrong old password

- **WHEN** 用户提供错误的 oldPassword
- **THEN** 返回 HTTP 422
- **AND** 错误信息为 `incorrectOldPassword`

#### Scenario: Update email

- **WHEN** 用户提供新的 email
- **AND** 新 email 不存在于系统中
- **THEN** 发送邮箱确认邮件到新地址
- **AND** email 不会立即更新（需确认后更新）

---

### Requirement: Confirm New Email

系统 SHALL 允许用户确认更换的新邮箱地址。

#### Scenario: Confirm new email success

- **WHEN** 用户提供有效的确认 hash
- **THEN** 更新用户的 email
- **AND** 用户状态更新为 `active`
- **AND** 返回 HTTP 204

---

### Requirement: Forgot Password

系统 SHALL 允许用户请求密码重置。

#### Scenario: Forgot password success

- **WHEN** 用户提供已注册的 email
- **THEN** 发送密码重置邮件
- **AND** 返回 HTTP 204

#### Scenario: Forgot password with non-existent email

- **WHEN** 用户提供不存在的 email
- **THEN** 返回 HTTP 422
- **AND** 错误信息为 `emailNotExists`

---

### Requirement: Reset Password

系统 SHALL 允许用户通过重置链接设置新密码。

#### Scenario: Reset password success

- **WHEN** 用户提供有效的 hash 和新 password
- **THEN** 更新用户密码
- **AND** 删除该用户的所有 Session
- **AND** 返回 HTTP 204

#### Scenario: Reset password with invalid hash

- **WHEN** 用户提供无效或过期的 hash
- **THEN** 返回 HTTP 422
- **AND** 错误信息为 `invalidHash`

---

### Requirement: Logout

系统 SHALL 允许已认证用户登出。

#### Scenario: Logout success

- **WHEN** 用户携带有效的 JWT token 请求登出
- **THEN** 删除当前 Session
- **AND** 返回 HTTP 204

---

### Requirement: Delete Account

系统 SHALL 允许已认证用户删除自己的账号。

#### Scenario: Delete account success

- **WHEN** 用户请求删除账号
- **THEN** 软删除用户记录
- **AND** 返回 HTTP 204

---

### Requirement: Send SMS Verification Code

系统 SHALL 允许用户请求发送短信验证码。

#### Scenario: Send code success

- **WHEN** 用户提供有效的手机号和验证码类型
- **AND** 未超过发送频率限制
- **THEN** 调用 SMS 服务发送验证码
- **AND** 返回 HTTP 204

#### Scenario: Send code with rate limit

- **WHEN** 用户频繁请求验证码
- **THEN** 返回 HTTP 429
- **AND** 提示等待时间

---

### Requirement: Phone Registration

系统 SHALL 允许用户通过手机号注册账号。

#### Scenario: Registration success

- **WHEN** 用户提供有效的 phone、code、password、firstName、lastName
- **AND** 验证码正确
- **THEN** 系统创建用户账号
- **AND** 用户 provider 设置为 `phone`
- **AND** 用户状态设置为 `active`
- **AND** 创建 Session
- **AND** 返回 JWT token、refresh token 和用户信息

#### Scenario: Registration with invalid code

- **WHEN** 用户提供错误的验证码
- **THEN** 返回 HTTP 422
- **AND** 错误信息为验证码相关错误

---

### Requirement: Phone Password Login

系统 SHALL 允许用户通过手机号和密码登录。

#### Scenario: Login success

- **WHEN** 用户提供正确的 phone 和 password
- **AND** 用户 provider 为 `phone`
- **THEN** 创建新的 Session
- **AND** 返回 JWT token、refresh token、token 过期时间和用户信息

#### Scenario: Login with wrong password

- **WHEN** 用户提供错误的 password
- **THEN** 返回 HTTP 422
- **AND** 错误信息为 `incorrectPassword`

---

### Requirement: Phone SMS Login

系统 SHALL 允许用户通过手机号和短信验证码登录。

#### Scenario: SMS login success

- **WHEN** 用户提供 phone 和正确的验证码
- **AND** 验证码验证通过
- **THEN** 创建新的 Session
- **AND** 返回 JWT token、refresh token 和用户信息

#### Scenario: SMS login with invalid code

- **WHEN** 用户提供错误的验证码
- **THEN** 返回 HTTP 422
- **AND** 错误信息为验证码相关错误

---

### Requirement: Phone Reset Password

系统 SHALL 允许用户通过手机验证码重置密码。

#### Scenario: Reset password success

- **WHEN** 用户提供 phone、正确的验证码和新密码
- **AND** 验证码验证通过
- **THEN** 更新用户密码
- **AND** 删除该用户的所有 Session
- **AND** 返回 HTTP 204

#### Scenario: Reset password with invalid code

- **WHEN** 用户提供错误的验证码
- **THEN** 返回 HTTP 422
- **AND** 错误信息为验证码相关错误

---

### Requirement: WeChat Login

系统 SHALL 允许用户通过微信授权登录。

#### Scenario: WeChat login success

- **WHEN** 用户提供有效的微信授权 code
- **THEN** 通过微信 API 获取用户信息
- **AND** 如果用户不存在，自动创建账号
- **AND** 用户 provider 设置为 `wechat`
- **AND** 创建新的 Session
- **AND** 返回 JWT token、refresh token 和用户信息

#### Scenario: WeChat login with invalid code

- **WHEN** 用户提供无效的微信授权 code
- **THEN** 返回 HTTP 422
- **AND** 错误信息为微信授权失败

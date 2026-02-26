# 认证授权开发规范

> 依赖：[api-development](./api-development.md)

## 认证体系

### JWT 双令牌机制

| 令牌          | 用途              | 有效期 | 配置                                  |
| ------------- | ----------------- | ------ | ------------------------------------- |
| Access Token  | API 请求认证      | 15m    | `AUTH_JWT_TOKEN_EXPIRES_IN`           |
| Refresh Token | 刷新 Access Token | 3650d  | `AUTH_REFRESH_TOKEN_EXPIRES_IN`       |
| Forgot Token  | 密码重置          | 30m    | `AUTH_FORGOT_TOKEN_EXPIRES_IN`        |
| Confirm Token | 邮箱验证          | 1d     | `AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN` |

### 多登录方式

1. **邮箱密码** — `POST /api/v1/auth/email/login`
2. **手机密码** — `POST /api/v1/auth/phone/login`
3. **手机短信验证码** — `POST /api/v1/auth/phone/sms-login`
4. **微信登录** — `POST /api/v1/auth/wechat/login`

### 认证流程

```
Client → POST /auth/email/login → AuthService.validateLogin()
  → 验证邮箱密码 → 生成 JWT + Refresh Token → 创建 Session
  → 返回 { token, refreshToken, tokenExpires }

Client → POST /auth/refresh → AuthService.refreshToken()
  → 验证 Refresh Token → 删除旧 Session → 创建新 Session
  → 返回新的 { token, refreshToken, tokenExpires }
```

## 使用 Guards

### 仅认证（JWT）

```typescript
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'features', version: '1' })
export class FeatureController {
  // 所有端点需要登录
}
```

### 认证 + 角色

```typescript
@ApiBearerAuth()
@Roles(RoleEnum.admin)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  // 仅管理员可访问
}
```

### 认证 + 权限（RBAC）

```typescript
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({ path: 'settings', version: '1' })
export class SettingsController {
  @Delete(':id')
  @RequirePermissions(Permission.SETTINGS_DELETE)
  remove(@Param('id') id: number) {
    // 需要 SETTINGS_DELETE 权限
  }
}
```

### Guard 执行顺序

```
AuthGuard('jwt') → 验证 JWT Token → request.user
  → RolesGuard → 检查 user.role.id 是否匹配
  → PermissionsGuard → 从数据库查询角色权限 → 验证所需权限
```

## 添加新权限

### 1. 在枚举中定义

```typescript
// src/core/permissions/permission.enum.ts
export enum Permission {
  // 已有权限...
  FEATURE_CREATE = 'feature.create',
  FEATURE_READ = 'feature.read',
  FEATURE_UPDATE = 'feature.update',
  FEATURE_DELETE = 'feature.delete',
}
```

### 2. 配置角色-权限映射

```typescript
// src/core/permissions/role-permissions.ts
export const ROLE_PERMISSIONS: Record<RoleEnum, Permission[]> = {
  [RoleEnum.admin]: [
    // admin 拥有所有权限
    ...Object.values(Permission),
  ],
  [RoleEnum.user]: [
    Permission.FEATURE_READ,
    // 普通用户权限...
  ],
};
```

### 3. 在 Controller 中使用

```typescript
@RequirePermissions(Permission.FEATURE_DELETE)
@Delete(':id')
remove(@Param('id') id: number) { ... }
```

## Session 管理

- 每次登录创建新 Session（支持多设备同时在线）
- Refresh Token 与 Session 绑定
- 注销时删除对应 Session
- Session 存储在数据库中，支持管理员查看/终止

## 安全规则

1. **密码哈希**：使用 bcryptjs（10 轮 salt）
2. **敏感字段**：Domain Entity 中 `@Exclude({ toPlainOnly: true })` 排除 password
3. **日志脱敏**：Pino 配置 redact 对 password, token, email, phone 脱敏
4. **Rate Limiting**：登录端点使用 Throttler 限流
5. **CORS**：生产环境仅允许配置的前端域名
6. **Helmet**：HTTP 安全头（CSP, XSS Protection 等）

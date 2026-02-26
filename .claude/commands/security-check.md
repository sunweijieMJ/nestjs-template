# 安全检查清单

## OWASP Top 10 对照

### 1. 注入攻击

- [ ] 使用 TypeORM 参数化查询，不拼接 SQL
- [ ] 使用 class-validator 验证所有输入
- [ ] `@Transform()` 清洗用户输入（trim, sanitize）

### 2. 认证失效

- [ ] JWT Secret 足够复杂（不使用默认值）
- [ ] Token 有合理过期时间
- [ ] Refresh Token 绑定 Session
- [ ] 密码使用 bcryptjs 哈希（10+ rounds）
- [ ] 登录端点有限流保护

### 3. 敏感数据泄露

- [ ] Domain Entity 敏感字段 `@Exclude({ toPlainOnly: true })`
- [ ] 日志已配置脱敏（password, token, email, phone）
- [ ] `.env` 不提交到版本控制
- [ ] 错误响应不暴露系统内部信息

### 4. 访问控制

- [ ] 端点使用 `@UseGuards(AuthGuard('jwt'))`
- [ ] 管理接口使用 `@Roles()` 或 `@RequirePermissions()`
- [ ] 用户只能访问/修改自己的数据

### 5. 安全配置

- [ ] Helmet 中间件已启用
- [ ] CORS 生产环境限制来源
- [ ] `synchronize: false`（生产环境）
- [ ] SSL/TLS 加密连接

## NestJS 特定检查

- [ ] 不使用 `process.env`（使用 ConfigService）
- [ ] Guard 执行顺序正确（Auth → Role → Permission）
- [ ] 文件上传有大小限制和类型检查
- [ ] Rate Limiting 已配置

## 配置安全

- [ ] 生产环境 `NODE_ENV=production`
- [ ] JWT Secret 非默认值
- [ ] 数据库密码非 `secret`
- [ ] Redis 设置密码（生产环境）

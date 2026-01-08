# Implementation Tasks

## 1. Database Schema

- [ ] 1.1 创建 shares 表的迁移文件
- [ ] 1.2 创建 share_logs 表的迁移文件
- [ ] 1.3 添加必要的索引（userId, shareCode, targetType, targetId, createdAt）
- [ ] 1.4 运行迁移并验证

## 2. Domain Layer

- [ ] 2.1 创建 Share 领域模型 (domain/share.ts)
- [ ] 2.2 创建 ShareLog 领域模型 (domain/share-log.ts)
- [ ] 2.3 定义分享目标类型和平台的枚举
- [ ] 2.4 定义分享日志动作类型枚举

## 3. DTOs

- [ ] 3.1 创建 CreateShareDto
- [ ] 3.2 创建 QueryShareDto（分页、筛选）
- [ ] 3.3 创建 ShareStatsDto
- [ ] 3.4 创建 WeChatConfigDto
- [ ] 3.5 创建 AlipayConfigDto
- [ ] 3.6 添加 Swagger 装饰器

## 4. Persistence Layer (Relational)

- [ ] 4.1 创建 Share Entity (relational/entities/share.entity.ts)
- [ ] 4.2 创建 ShareLog Entity (relational/entities/share-log.entity.ts)
- [ ] 4.3 创建 Share Mapper (relational/mappers/share.mapper.ts)
- [ ] 4.4 创建 ShareLog Mapper (relational/mappers/share-log.mapper.ts)
- [ ] 4.5 实现 Share Repository (relational/repositories/share.repository.ts)
- [ ] 4.6 实现 ShareLog Repository (relational/repositories/share-log.repository.ts)

## 5. Service Layer

- [ ] 5.1 创建 SharesService
- [ ] 5.2 实现创建分享逻辑（生成唯一 shareCode）
- [ ] 5.3 实现查询分享列表（分页、筛选）
- [ ] 5.4 实现通过 shareCode 获取分享内容
- [ ] 5.5 实现分享统计追踪（view, click, conversion）
- [ ] 5.6 实现删除分享（软删除）
- [ ] 5.7 实现分享过期检查

## 6. WeChat Integration Extension

- [ ] 6.1 扩展 WeChatService 添加 JS-SDK 支持
- [ ] 6.2 实现获取 jsapi_ticket 逻辑
- [ ] 6.3 实现 JS-SDK 签名生成（SHA1 算法）
- [ ] 6.4 实现 jsapi_ticket 缓存（7200秒）
- [ ] 6.5 创建 getJsSdkConfig 方法

## 7. Alipay Integration Extension

- [ ] 7.1 扩展 AlipayService 添加分享配置支持
- [ ] 7.2 创建 getShareConfig 方法
- [ ] 7.3 实现支付宝小程序分享配置格式化

## 8. Controller Layer

- [ ] 8.1 创建 SharesController
- [ ] 8.2 实现 POST /shares（创建分享）
- [ ] 8.3 实现 GET /shares（获取用户分享列表）
- [ ] 8.4 实现 GET /shares/:id（获取分享详情）
- [ ] 8.5 实现 GET /shares/code/:code（通过分享码获取内容）
- [ ] 8.6 实现 DELETE /shares/:id（删除分享）
- [ ] 8.7 实现 GET /shares/:id/stats（获取分享统计）
- [ ] 8.8 实现 POST /shares/wechat/config（获取微信JS-SDK配置）
- [ ] 8.9 实现 POST /shares/alipay/config（获取支付宝分享配置）
- [ ] 8.10 添加 JWT 认证守卫
- [ ] 8.11 添加权限验证

## 9. Module Configuration

- [ ] 9.1 创建 SharesModule
- [ ] 9.2 配置依赖注入
- [ ] 9.3 注入 WeChatService 和 AlipayService
- [ ] 9.4 在 AppModule 中导入

## 10. Utilities

- [ ] 10.1 创建 shareCode 生成工具函数（8位唯一码）
- [ ] 10.2 创建微信签名生成工具函数
- [ ] 10.3 创建分享链接构建工具函数

## 11. Testing

- [ ] 11.1 编写 SharesService 单元测试
- [ ] 11.2 编写 SharesController 单元测试
- [ ] 11.3 编写 Repository 单元测试
- [ ] 11.4 编写微信签名生成测试
- [ ] 11.5 编写 E2E 测试

## 12. Documentation

- [ ] 12.1 更新 Swagger API 文档
- [ ] 12.2 添加 UniApp 对接示例（微信、支付宝）
- [ ] 12.3 更新 README（如需要）

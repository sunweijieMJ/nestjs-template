# Implementation Tasks

## 1. Database Schema

- [ ] 1.1 创建 notifications 表的迁移文件
- [ ] 1.2 创建 notification_settings 表的迁移文件
- [ ] 1.3 添加必要的索引（userId, category, isRead, createdAt）
- [ ] 1.4 运行迁移并验证

## 2. Domain Layer

- [ ] 2.1 创建 Notification 领域模型 (domain/notification.ts)
- [ ] 2.2 创建 NotificationSetting 领域模型 (domain/notification-setting.ts)
- [ ] 2.3 定义通知类型和分类的枚举

## 3. DTOs

- [ ] 3.1 创建 CreateNotificationDto
- [ ] 3.2 创建 QueryNotificationDto（分页、筛选）
- [ ] 3.3 创建 UpdateNotificationSettingsDto
- [ ] 3.4 添加 Swagger 装饰器

## 4. Persistence Layer (Relational)

- [ ] 4.1 创建 Notification Entity (relational/entities/notification.entity.ts)
- [ ] 4.2 创建 NotificationSetting Entity (relational/entities/notification-setting.entity.ts)
- [ ] 4.3 创建 Notification Mapper (relational/mappers/notification.mapper.ts)
- [ ] 4.4 创建 NotificationSetting Mapper (relational/mappers/notification-setting.mapper.ts)
- [ ] 4.5 实现 Notification Repository (relational/repositories/notification.repository.ts)
- [ ] 4.6 实现 NotificationSetting Repository (relational/repositories/notification-setting.repository.ts)

## 5. Service Layer

- [ ] 5.1 创建 NotificationsService
- [ ] 5.2 实现创建通知逻辑
- [ ] 5.3 实现查询通知列表（分页、筛选）
- [ ] 5.4 实现标记已读功能
- [ ] 5.5 实现获取未读数量
- [ ] 5.6 实现删除通知（软删除）
- [ ] 5.7 实现通知设置管理
- [ ] 5.8 集成用户偏好检查逻辑

## 6. Queue Processing

- [ ] 6.1 创建 notification-queue 目录
- [ ] 6.2 创建 NotificationQueueProcessor
- [ ] 6.3 实现邮件通知处理器
- [ ] 6.4 实现短信通知处理器
- [ ] 6.5 配置重试策略（3次，指数退避）
- [ ] 6.6 实现发送状态追踪

## 7. Controller Layer

- [ ] 7.1 创建 NotificationsController
- [ ] 7.2 实现 GET /notifications（获取列表）
- [ ] 7.3 实现 GET /notifications/:id（获取详情）
- [ ] 7.4 实现 PATCH /notifications/:id/read（标记已读）
- [ ] 7.5 实现 PATCH /notifications/read-all（全部已读）
- [ ] 7.6 实现 DELETE /notifications/:id（删除）
- [ ] 7.7 实现 GET /notifications/unread-count（未读数量）
- [ ] 7.8 实现 GET /notifications/settings（获取设置）
- [ ] 7.9 实现 PATCH /notifications/settings（更新设置）
- [ ] 7.10 添加 JWT 认证守卫
- [ ] 7.11 添加权限验证

## 8. Module Configuration

- [ ] 8.1 创建 NotificationsModule
- [ ] 8.2 配置依赖注入
- [ ] 8.3 注册队列处理器
- [ ] 8.4 在 AppModule 中导入

## 9. Integration

- [ ] 9.1 集成现有的 MailService
- [ ] 9.2 集成现有的 SmsService
- [ ] 9.3 配置 BullMQ 队列

## 10. Testing

- [ ] 10.1 编写 Service 单元测试
- [ ] 10.2 编写 Controller 单元测试
- [ ] 10.3 编写 Repository 单元测试
- [ ] 10.4 编写 Queue Processor 单元测试
- [ ] 10.5 编写 E2E 测试

## 11. Documentation

- [ ] 11.1 更新 Swagger API 文档
- [ ] 11.2 添加 UniApp 对接示例
- [ ] 11.3 更新 README（如需要）

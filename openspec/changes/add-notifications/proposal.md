# Change: 添加通知系统

## Why

应用需要一个通知系统来告知用户重要事件，如订单更新、支付确认、系统公告和促销活动。这对于 UniApp 集成（H5、小程序和原生 App）保持用户参与度和信息同步至关重要。

目前，系统仅针对特定用例（认证相关）提供邮件和短信功能。一个完善的通知系统将提供：

- 统一的业务事件通知管理
- 多渠道发送（应用内、邮件、短信、推送通知）
- 用户偏好控制
- 通知历史和已读/未读追踪

## What Changes

- 添加新的 `notifications` 模块，包含完整的 CRUD 操作
- 添加 `notification-settings` 用于按通知分类配置用户偏好
- 集成现有的邮件和短信服务以实现多渠道发送
- 使用 BullMQ 添加基于队列的通知处理
- 支持通知分类：ORDER（订单）、PAYMENT（支付）、SYSTEM（系统）、PROMOTION（促销）
- 支持通知类型：INFO（信息）、WARNING（警告）、SUCCESS（成功）、ERROR（错误）
- 为 UniApp 客户端提供获取和管理通知的 API
- 添加未读数量端点用于徽章显示

## Impact

- **新增规范**: `notifications` 能力
- **影响的代码**:
  - 新模块: `src/modules/notifications/`
  - 集成: `src/integrations/mail/`, `src/integrations/sms/`
  - 新队列处理器: `src/infrastructure/queue/notification-queue/`
  - 数据库迁移: `notifications` 和 `notification_settings` 表
- **依赖**: 利用现有的 BullMQ、邮件和短信基础设施
- **API**: `/api/v1/notifications` 下的新端点

# 通知系统规范

## ADDED Requirements

### Requirement: 通知创建

系统 SHALL 允许为用户创建通知，并支持多渠道发送。

#### Scenario: 创建系统通知

- **WHEN** 系统事件发生时（订单更新、支付确认等）
- **THEN** 创建包含指定类型、分类、标题、内容和目标渠道的通知
- **AND** 将通知加入队列，通过选定的渠道发送

#### Scenario: 创建带元数据的通知

- **WHEN** 创建包含业务特定数据的通知时
- **THEN** 系统将元数据存储为 JSON 格式
- **AND** 检索通知时可以获取元数据

### Requirement: 通知检索

系统 SHALL 提供 API 来检索通知，支持分页和筛选。

#### Scenario: 获取用户通知列表

- **WHEN** 用户请求其通知列表并提供分页参数时
- **THEN** 返回按创建时间排序的分页通知列表（最新的在前）
- **AND** 包含通知详情：id、type、category、title、content、isRead、readAt、createdAt

#### Scenario: 按分类筛选通知

- **WHEN** 用户请求按分类筛选的通知（ORDER、PAYMENT、SYSTEM、PROMOTION）时
- **THEN** 仅返回匹配指定分类的通知

#### Scenario: 按已读状态筛选通知

- **WHEN** 用户请求未读通知时
- **THEN** 仅返回 isRead 为 false 的通知

#### Scenario: 获取通知详情

- **WHEN** 用户通过 ID 请求特定通知时
- **THEN** 返回完整的通知详情，包括元数据
- **AND** 用户必须拥有该通知（权限检查）

### Requirement: 通知已读状态管理

系统 SHALL 允许用户标记通知为已读，并追踪已读时间戳。

#### Scenario: 标记单个通知为已读

- **WHEN** 用户标记一个通知为已读时
- **THEN** 将 isRead 设置为 true 并记录 readAt 时间戳
- **AND** 返回更新后的通知

#### Scenario: 标记所有通知为已读

- **WHEN** 用户请求标记所有通知为已读时
- **THEN** 更新该用户的所有未读通知
- **AND** 将每个通知的 isRead 设置为 true，readAt 设置为当前时间戳

#### Scenario: 获取未读数量

- **WHEN** 用户请求其未读通知数量时
- **THEN** 返回 isRead 为 false 的通知总数
- **AND** 可选地按分类分组统计数量

### Requirement: 通知删除

系统 SHALL 支持通知的软删除。

#### Scenario: 删除单个通知

- **WHEN** 用户删除一个通知时
- **THEN** 通过设置 deletedAt 时间戳执行软删除
- **AND** 该通知不再出现在用户的通知列表中

#### Scenario: 防止未授权删除

- **WHEN** 用户尝试删除其他用户的通知时
- **THEN** 返回 403 Forbidden 错误

### Requirement: 多渠道通知发送

系统 SHALL 支持根据用户偏好通过多个渠道发送通知。

#### Scenario: 向多个渠道发送通知

- **WHEN** 创建包含渠道 [IN_APP, EMAIL, SMS] 的通知时
- **THEN** 将通知存储到数据库以供应用内显示
- **AND** 将邮件和短信发送任务加入队列进行异步处理
- **AND** 在 sentChannels 字段中追踪每个渠道的发送状态

#### Scenario: 遵守用户渠道偏好

- **WHEN** 为用户创建通知时
- **THEN** 检查用户针对该分类的通知设置
- **AND** 仅通过用户已启用的渠道发送

### Requirement: 通知设置管理

系统 SHALL 允许用户按分类和渠道配置通知偏好。

#### Scenario: 获取用户通知设置

- **WHEN** 用户请求其通知设置时
- **THEN** 返回所有分类的设置（ORDER、PAYMENT、SYSTEM、PROMOTION）
- **AND** 包含每个渠道的启用/禁用状态（IN_APP、EMAIL、SMS、PUSH）

#### Scenario: 更新通知设置

- **WHEN** 用户更新特定分类的设置时
- **THEN** 保存渠道偏好（enableInApp、enableEmail、enableSms、enablePush）
- **AND** 将设置应用于该分类的未来通知

#### Scenario: 默认通知设置

- **WHEN** 创建新用户时
- **THEN** 为所有分类初始化默认通知设置
- **AND** 默认启用所有渠道

### Requirement: 基于队列的通知处理

系统 SHALL 使用 BullMQ 进行异步通知发送到外部渠道。

#### Scenario: 队列邮件通知

- **WHEN** 通知需要邮件发送时
- **THEN** 将包含邮件负载的任务添加到通知队列
- **AND** 队列处理器使用邮件服务发送邮件
- **AND** 更新 sentChannels 中的发送状态

#### Scenario: 队列短信通知

- **WHEN** 通知需要短信发送时
- **THEN** 将包含短信负载的任务添加到通知队列
- **AND** 队列处理器使用短信服务发送短信
- **AND** 更新 sentChannels 中的发送状态

#### Scenario: 重试失败的发送

- **WHEN** 通知发送失败时
- **THEN** 使用指数退避策略重试最多 3 次
- **AND** 如果所有重试都失败，在 sentChannels 中标记该渠道为失败

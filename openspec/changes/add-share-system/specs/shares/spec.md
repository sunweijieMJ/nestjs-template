# 分享系统规范

## ADDED Requirements

### Requirement: 分享创建

系统 SHALL 允许用户为内容创建带有唯一追踪码的分享链接。

#### Scenario: 为商品创建分享

- **WHEN** 用户为商品创建分享时
- **THEN** 生成唯一的 shareCode（8位字符）
- **AND** 创建包含 targetType=PRODUCT、targetId、platform、title、description、image、url 的分享记录
- **AND** 返回包含 shareCode 和完整分享 URL 的分享详情

#### Scenario: 创建带自定义元数据的分享

- **WHEN** 创建包含业务特定数据的分享时
- **THEN** 将元数据存储为 JSON 格式
- **AND** 检索分享时可以获取元数据

#### Scenario: 创建带过期时间的分享

- **WHEN** 创建包含 expiresAt 时间戳的分享时
- **THEN** 分享链接在过期后失效
- **AND** 访问过期分享返回 410 Gone 错误

### Requirement: 分享检索

系统 SHALL 提供 API 来检索分享信息和用户的分享历史。

#### Scenario: 通过分享码获取分享

- **WHEN** 使用 shareCode 访问分享链接时
- **THEN** 返回分享详情（title、description、image、url、targetType、targetId）
- **AND** 增加 viewCount
- **AND** 在 share_logs 中记录查看动作

#### Scenario: 获取用户的分享列表

- **WHEN** 用户请求其分享历史并提供分页参数时
- **THEN** 返回按创建时间排序的分页分享列表（最新的在前）
- **AND** 包含统计数据（viewCount、clickCount、conversionCount）

#### Scenario: 通过 ID 获取分享详情

- **WHEN** 用户通过 ID 请求特定分享时
- **THEN** 返回完整的分享详情，包括元数据
- **AND** 用户必须拥有该分享（权限检查）

### Requirement: 分享统计追踪

系统 SHALL 追踪分享性能指标，包括浏览、点击和转化。

#### Scenario: 追踪分享浏览

- **WHEN** 用户访问分享链接时
- **THEN** 增加分享记录的 viewCount
- **AND** 创建包含 action=VIEW、访客 IP、userAgent、platform 的 share_log 条目

#### Scenario: 追踪分享点击

- **WHEN** 用户从分享点击进入目标内容时
- **THEN** 增加分享记录的 clickCount
- **AND** 创建包含 action=CLICK 的 share_log 条目

#### Scenario: 追踪分享转化

- **WHEN** 用户从分享完成转化动作（购买、注册等）时
- **THEN** 增加分享记录的 conversionCount
- **AND** 创建包含 action=CONVERSION 的 share_log 条目

#### Scenario: 获取分享统计

- **WHEN** 用户请求其分享的统计数据时
- **THEN** 返回 viewCount、clickCount、conversionCount
- **AND** 计算转化率（conversionCount / viewCount）

### Requirement: 分享删除

系统 SHALL 支持分享的软删除。

#### Scenario: 删除分享

- **WHEN** 用户删除其分享时
- **THEN** 通过设置 deletedAt 时间戳执行软删除
- **AND** 分享链接变为不可访问
- **AND** 访问已删除分享返回 404 Not Found 错误

#### Scenario: 防止未授权删除

- **WHEN** 用户尝试删除其他用户的分享时
- **THEN** 返回 403 Forbidden 错误

### Requirement: 微信分享配置

系统 SHALL 提供微信 JS-SDK 配置以支持 H5 分享。

#### Scenario: 获取微信 JS-SDK 配置

- **WHEN** 客户端请求微信 JS-SDK 配置并提供页面 URL 时
- **THEN** 使用微信 jsapi_ticket 生成签名
- **AND** 返回包含 appId、timestamp、nonceStr、signature 的配置
- **AND** 缓存 jsapi_ticket 7200 秒

#### Scenario: 处理微信签名验证

- **WHEN** 生成微信 JS-SDK 签名时
- **THEN** 使用 SHA1 算法和排序后的参数（jsapi_ticket、noncestr、timestamp、url）
- **AND** 确保 URL 完全匹配（包括协议和查询参数）

### Requirement: 支付宝分享配置

系统 SHALL 提供支付宝分享配置以支持小程序和 H5 分享。

#### Scenario: 获取支付宝分享配置

- **WHEN** 客户端请求支付宝分享配置时
- **THEN** 返回包含 title、description、image、path 的分享配置
- **AND** 按照支付宝小程序分享要求格式化

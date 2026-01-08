# Change: 添加分享系统

## Why

应用需要一个分享系统，使用户能够将内容（商品、文章、页面）分享到微信和支付宝等社交平台。这对于 UniApp 集成（H5、小程序和原生 App）至关重要，以便：

- 提高用户参与度和内容传播性
- 追踪分享性能和转化指标
- 支持平台特定的分享配置（微信 JS-SDK、支付宝分享）
- 生成带追踪码的唯一分享链接

目前，系统已有微信支付和支付宝支付集成，但缺少分享功能。一个完善的分享系统将提供跨所有平台的统一分享管理。

## What Changes

- 添加新的 `shares` 模块，包含分享链接生成和追踪功能
- 添加 `share-logs` 用于追踪分享性能（浏览、点击、转化）
- 扩展微信集成以支持 H5 分享的 JS-SDK 签名生成
- 扩展支付宝集成以支持分享配置
- 支持分享目标类型：PRODUCT（商品）、ARTICLE（文章）、PAGE（页面）、STORE（店铺）
- 支持平台：WECHAT（微信）、ALIPAY（支付宝）、H5、APP
- 为 UniApp 客户端提供创建分享和获取平台配置的 API
- 追踪分享统计（viewCount、clickCount、conversionCount）

## Impact

- **新增规范**: `shares` 能力
- **影响的规范**: `wechat-pay`（扩展 JS-SDK）、`alipay`（扩展分享配置）
- **影响的代码**:
  - 新模块: `src/modules/shares/`
  - 扩展: `src/integrations/wechat/`, `src/integrations/alipay/`
  - 数据库迁移: `shares` 和 `share_logs` 表
- **API**: `/api/v1/shares` 下的新端点

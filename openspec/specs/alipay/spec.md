# Alipay Module Specification

## Purpose

支付宝集成模块，提供支付宝支付和授权登录的完整功能。支持手机网站支付、电脑网站支付、订单查询、关闭订单、退款等核心支付功能，以及支付宝授权登录和用户信息获取。采用 RSA/RSA2 签名算法确保安全性，支持支付回调验证。适用于电商、服务预订等需要在线支付和第三方登录的场景。

## Requirements

### Requirement: Alipay OAuth Login

系统 SHALL 支持支付宝授权登录。

#### Scenario: Get authorization URL

- **WHEN** 调用获取授权 URL
- **AND** 提供 redirectUri 和可选的 state
- **THEN** 返回支付宝授权页面 URL
- **AND** URL 包含 app_id、scope、redirect_uri、state 参数

#### Scenario: Exchange auth code for token

- **WHEN** 用户授权后获得 auth code
- **THEN** 调用支付宝 API 交换 access_token
- **AND** 返回 access_token、user_id、expires_in

#### Scenario: Get user info

- **WHEN** 使用 access_token 获取用户信息
- **THEN** 调用支付宝用户信息接口
- **AND** 返回 user_id、nick_name、avatar

---

### Requirement: Mobile Website Payment

系统 SHALL 支持手机网站支付。

#### Scenario: Create mobile payment

- **WHEN** 调用创建手机网站支付
- **AND** 提供 outTradeNo、subject、totalAmount、body
- **THEN** 生成支付表单 HTML
- **AND** 表单自动提交到支付宝网关
- **AND** 跳转到支付宝收银台

---

### Requirement: Web Payment

系统 SHALL 支持电脑网站支付。

#### Scenario: Create web payment

- **WHEN** 调用创建电脑网站支付
- **AND** 提供 outTradeNo、subject、totalAmount、body
- **THEN** 生成支付表单 HTML
- **AND** 表单自动提交到支付宝网关
- **AND** 跳转到支付宝收银台

---

### Requirement: Query Order

系统 SHALL 支持查询订单状态。

#### Scenario: Query order by out_trade_no

- **WHEN** 提供商户订单号 outTradeNo
- **THEN** 调用支付宝订单查询接口
- **AND** 返回订单信息（trade_no、out_trade_no、trade_status、total_amount）

#### Scenario: Trade status types

- **WHEN** 查询订单状态
- **THEN** 可能的状态包括：
  - WAIT_BUYER_PAY - 等待买家付款
  - TRADE_CLOSED - 交易关闭
  - TRADE_SUCCESS - 交易成功
  - TRADE_FINISHED - 交易完结

---

### Requirement: Close Order

系统 SHALL 支持关闭订单。

#### Scenario: Close order

- **WHEN** 提供商户订单号 outTradeNo
- **THEN** 调用支付宝关闭订单接口
- **AND** 返回 trade_no 和 out_trade_no

---

### Requirement: Refund

系统 SHALL 支持申请退款。

#### Scenario: Create refund

- **WHEN** 提供 outTradeNo、refundAmount、refundReason
- **THEN** 调用支付宝退款接口
- **AND** 返回退款信息（trade_no、out_trade_no、refund_fee）

---

### Requirement: Notification Verification

系统 SHALL 验证支付宝回调通知的签名。

#### Scenario: Verify notification signature

- **WHEN** 接收到支付宝回调通知
- **THEN** 从参数中提取 sign 和 sign_type
- **AND** 移除 sign 和 sign_type 参数
- **AND** 构建待验签字符串（参数按 key 排序后拼接）
- **AND** 使用支付宝公钥验证签名
- **AND** 验证通过返回 true

---

### Requirement: Request Signature

系统 SHALL 对所有支付宝 API 请求进行签名。

#### Scenario: Sign API request

- **WHEN** 发送请求到支付宝 API
- **THEN** 构建待签名字符串（参数按 key 排序后拼接）
- **AND** 使用商户私钥签名（RSA/RSA2）
- **AND** 将签名添加到请求参数中

---

### Requirement: Configuration

系统 SHALL 从配置中读取支付宝相关设置。

| 配置项                 | 说明                   |
| ---------------------- | ---------------------- |
| alipay.appId           | 支付宝应用 ID          |
| alipay.privateKey      | 商户私钥（用于签名）   |
| alipay.alipayPublicKey | 支付宝公钥（用于验签） |
| alipay.gateway         | 支付宝网关 URL         |
| alipay.notifyUrl       | 支付回调通知 URL       |
| alipay.returnUrl       | 支付同步返回 URL       |
| alipay.signType        | 签名类型（RSA/RSA2）   |
| alipay.charset         | 字符集（默认 utf-8）   |

#### Scenario: Read configuration

- **WHEN** 支付宝服务初始化
- **THEN** 从 ConfigService 读取配置
- **AND** 验证必需配置项存在

---

### Requirement: Payment Notification Endpoint

系统 SHALL 提供支付回调通知端点。

#### Scenario: Receive payment notification

- **WHEN** 支付宝服务器发送支付结果通知到 `POST /alipay/notify`
- **THEN** 验证请求签名
- **AND** 解析支付结果数据
- **AND** 返回 success 确认接收

#### Scenario: Invalid notification signature

- **WHEN** 接收到签名验证失败的通知
- **THEN** 拒绝处理
- **AND** 返回 failure

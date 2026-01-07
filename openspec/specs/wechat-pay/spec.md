# WeChat Pay Module Specification

## Purpose

微信支付集成模块，提供微信支付 API V3 的完整支付功能。支持 JSAPI 支付（小程序/公众号）、APP 支付、订单查询、退款等核心功能。采用 RSA-SHA256 签名算法确保安全性，支持支付回调验证。适用于电商、服务预订等需要在线支付的场景。

## Requirements

### Requirement: JSAPI Payment

系统 SHALL 支持 JSAPI 支付（小程序/公众号支付）。

#### Scenario: Create JSAPI payment

- **WHEN** 调用创建 JSAPI 支付
- **AND** 提供 openid、outTradeNo、description、amount
- **THEN** 向微信支付 API 发送统一下单请求
- **AND** 获取 prepay_id
- **AND** 生成小程序支付参数（timeStamp、nonceStr、package、signType、paySign）
- **AND** 返回支付参数供前端调起支付

#### Scenario: Generate payment signature

- **WHEN** 生成支付参数
- **THEN** 使用商户私钥签名
- **AND** 签名算法为 RSA-SHA256
- **AND** 签名内容包含 appid、timestamp、nonceStr、package

---

### Requirement: APP Payment

系统 SHALL 支持 APP 支付。

#### Scenario: Create APP payment

- **WHEN** 调用创建 APP 支付
- **AND** 提供 outTradeNo、description、amount
- **THEN** 向微信支付 API 发送统一下单请求
- **AND** 获取 prepay_id
- **AND** 生成 APP 支付参数（appid、partnerid、prepayid、package、noncestr、timestamp、sign）
- **AND** 返回支付参数供 APP 调起支付

---

### Requirement: Query Order

系统 SHALL 支持查询订单状态。

#### Scenario: Query order by out_trade_no

- **WHEN** 提供商户订单号 outTradeNo
- **THEN** 向微信支付 API 查询订单
- **AND** 返回订单信息（out_trade_no、transaction_id、trade_state、trade_state_desc、amount）

#### Scenario: Order status types

- **WHEN** 查询订单状态
- **THEN** 可能的状态包括：
  - SUCCESS - 支付成功
  - REFUND - 转入退款
  - NOTPAY - 未支付
  - CLOSED - 已关闭
  - REVOKED - 已撤销
  - USERPAYING - 用户支付中
  - PAYERROR - 支付失败

---

### Requirement: Refund

系统 SHALL 支持申请退款。

#### Scenario: Create refund

- **WHEN** 提供 outTradeNo、outRefundNo、refundAmount、totalAmount、reason
- **THEN** 向微信支付 API 发送退款请求
- **AND** 返回退款信息（refund_id、out_refund_no、transaction_id、out_trade_no、status）

#### Scenario: Partial refund

- **WHEN** refundAmount 小于 totalAmount
- **THEN** 执行部分退款
- **AND** 同一订单可多次退款

#### Scenario: Full refund

- **WHEN** refundAmount 等于 totalAmount
- **THEN** 执行全额退款

---

### Requirement: Payment Notification Verification

系统 SHALL 验证微信支付回调通知的签名。

#### Scenario: Verify notification signature

- **WHEN** 接收到微信支付回调通知
- **THEN** 从 headers 中提取 wechatpay-signature、wechatpay-timestamp、wechatpay-nonce、wechatpay-serial
- **AND** 检查时间戳是否在 5 分钟内（防重放攻击）
- **AND** 使用平台证书公钥验证签名
- **AND** 验证通过返回解密后的数据

#### Scenario: Timestamp expired

- **WHEN** 回调请求时间戳超过 5 分钟
- **THEN** 拒绝请求
- **AND** 记录警告日志

---

### Requirement: Request Signature

系统 SHALL 对所有微信支付 API 请求进行签名。

#### Scenario: Sign API request

- **WHEN** 发送请求到微信支付 API
- **THEN** 构建签名字符串（method、url path、timestamp、nonce、body）
- **AND** 使用商户私钥签名（RSA-SHA256）
- **AND** 在 Authorization header 中包含签名信息

#### Scenario: Authorization header format

- **WHEN** 构建 Authorization header
- **THEN** 格式为 `WECHATPAY2-SHA256-RSA2048 mchid="{mchid}",nonce_str="{nonce}",signature="{signature}",timestamp="{timestamp}",serial_no="{serial}"`

---

### Requirement: Configuration

系统 SHALL 从配置中读取微信支付相关设置。

| 配置项                | 说明                 |
| --------------------- | -------------------- |
| wechat.appId          | 微信开放平台 APP ID  |
| wechat.miniAppId      | 微信小程序 APP ID    |
| wechat.pay.mchId      | 商户号               |
| wechat.pay.privateKey | 商户私钥（用于签名） |
| wechat.pay.serialNo   | 商户证书序列号       |
| wechat.pay.notifyUrl  | 支付回调通知 URL     |

#### Scenario: Read configuration

- **WHEN** 微信支付服务初始化
- **THEN** 从 ConfigService 读取配置
- **AND** 验证必需配置项存在

---

### Requirement: Error Handling

系统 SHALL 处理微信支付 API 错误。

#### Scenario: API request failure

- **WHEN** 微信支付 API 返回错误
- **THEN** 记录详细错误日志
- **AND** 抛出包含错误信息的异常

#### Scenario: Network retry

- **WHEN** 网络请求失败
- **THEN** 自动重试最多 3 次
- **AND** 重试间隔 1 秒
- **AND** 请求超时时间 30 秒

---

### Requirement: Payment Notification Endpoint

系统 SHALL 提供支付回调通知端点。

#### Scenario: Receive payment notification

- **WHEN** 微信支付服务器发送支付结果通知到 `POST /wechat/notify`
- **THEN** 验证请求签名
- **AND** 解析支付结果数据
- **AND** 返回 HTTP 200 确认接收

#### Scenario: Invalid notification signature

- **WHEN** 接收到签名验证失败的通知
- **THEN** 拒绝处理
- **AND** 返回 HTTP 400

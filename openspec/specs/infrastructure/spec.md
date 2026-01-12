# Infrastructure Module Specification

## Purpose

基础设施层模块集合，提供应用运行所需的底层支撑服务。包括健康检查（支持 Kubernetes 探针）、缓存（Redis/内存）、消息队列（BullMQ）、API 限流（Throttler）、监控指标（Prometheus）。这些模块均为全局模块，可在整个应用中使用。

## Requirements

### Requirement: Health Check Endpoints

系统 SHALL 提供健康检查 API 端点，支持 Kubernetes 探针。

| 端点                     | 用途         | 检查项                    |
| ------------------------ | ------------ | ------------------------- |
| GET /api/v1/health       | 综合健康检查 | 内存、磁盘、数据库、Redis |
| GET /api/v1/health/live  | 存活探针     | 仅内存                    |
| GET /api/v1/health/ready | 就绪探针     | 数据库连接                |

#### Scenario: Full health check

- **WHEN** 请求 `/api/v1/health`
- **THEN** 检查内存堆使用（阈值 300MB）
- **AND** 检查磁盘使用（阈值 90%）
- **AND** 检查数据库连接（PostgreSQL）
- **AND** 如果 Redis 启用，检查 Redis 连接
- **AND** 返回综合健康状态

#### Scenario: Liveness probe

- **WHEN** 请求 `/api/v1/health/live`
- **THEN** 仅检查内存堆使用
- **AND** 用于 Kubernetes 判断是否需要重启 Pod

#### Scenario: Readiness probe

- **WHEN** 请求 `/api/v1/health/ready`
- **THEN** 检查数据库连接是否就绪
- **AND** 用于 Kubernetes 判断是否可以接收流量

#### Scenario: Redis health indicator

- **WHEN** Redis 启用且健康检查时
- **THEN** 连接 Redis 并执行 PING 命令
- **AND** 收到 PONG 响应表示健康

---

### Requirement: Cache Module

系统 SHALL 提供全局缓存功能，支持 Redis 和内存两种后端。

#### Scenario: Redis cache enabled

- **WHEN** 配置 `redis.enabled = true`
- **THEN** 使用 Redis 作为缓存存储
- **AND** 默认 TTL 为 60 秒
- **AND** 缓存数据在多实例间共享

#### Scenario: Memory cache fallback

- **WHEN** 配置 `redis.enabled = false`
- **THEN** 使用内存作为缓存存储
- **AND** 默认 TTL 为 60 秒
- **AND** 缓存数据仅在当前实例有效

#### Scenario: Cache configuration

- **WHEN** 缓存模块初始化
- **THEN** 从配置读取 Redis 连接信息（host、port、password、db）
- **AND** 缓存模块为全局模块，可在任何地方注入使用

---

### Requirement: Queue Module (BullMQ)

系统 SHALL 提供基于 BullMQ 的消息队列功能，依赖 Redis。

#### Scenario: Queue initialization

- **WHEN** Redis 启用
- **THEN** 初始化 BullMQ 连接
- **AND** 配置默认任务选项：完成后保留 100 条、失败后保留 1000 条、最多重试 3 次、指数退避延迟

#### Scenario: Queue disabled

- **WHEN** Redis 未启用
- **THEN** 队列功能不可用
- **AND** 应用不会崩溃，仅记录警告日志

---

### Requirement: Mail Queue

系统 SHALL 提供邮件队列功能，异步发送邮件。

#### Scenario: Add mail job

- **WHEN** 调用 `addMailJob(data)`
- **AND** Redis 启用
- **THEN** 将邮件任务添加到队列
- **AND** 设置优先级为 1
- **AND** 返回 true

#### Scenario: Add mail job without Redis

- **WHEN** 调用 `addMailJob(data)`
- **AND** Redis 未启用
- **THEN** 记录警告日志
- **AND** 返回 false

#### Scenario: Bulk mail jobs

- **WHEN** 调用 `addBulkMailJobs(jobs[])`
- **AND** Redis 启用
- **THEN** 批量将邮件任务添加到队列
- **AND** 返回 true

#### Scenario: Get queue stats

- **WHEN** 调用 `getQueueStats()`
- **THEN** 返回队列统计信息
- **AND** 包含 waiting、active、completed、failed、delayed 计数

---

### Requirement: Throttler (Rate Limiting)

系统 SHALL 提供全局 API 限流功能，防止滥用。

#### Scenario: Throttler enabled

- **WHEN** 配置 `throttler.enabled = true`
- **THEN** 应用全局限流守卫
- **AND** 在 TTL 时间窗口内限制请求数量

#### Scenario: Throttler configuration

- **WHEN** 限流模块初始化
- **THEN** 从配置读取 TTL（默认 60000ms）
- **AND** 从配置读取 limit（默认 10 次）

#### Scenario: Throttler disabled

- **WHEN** 配置 `throttler.enabled = false`
- **THEN** 跳过所有限流检查
- **AND** 不影响正常请求

#### Scenario: Rate limit exceeded

- **WHEN** 请求超过限流阈值
- **THEN** 返回 HTTP 429 Too Many Requests

---

### Requirement: Metrics Module (Prometheus)

系统 SHALL 提供 Prometheus 格式的监控指标。

#### Scenario: Metrics endpoint

- **WHEN** 配置 `metrics.enabled = true`
- **THEN** 暴露 `/{metrics.path}` 端点（默认 `/metrics`）
- **AND** 返回 Prometheus 格式的指标数据

#### Scenario: HTTP metrics

- **WHEN** HTTP 请求被处理
- **THEN** 记录 `http_requests_total` 计数器（按 method、path、status 分组）
- **AND** 记录 `http_request_duration_seconds` 直方图
- **AND** 记录 `http_active_connections` 仪表盘

#### Scenario: Database metrics

- **WHEN** 数据库查询执行
- **THEN** 记录 `database_query_duration_seconds` 直方图（按 operation、table 分组）

#### Scenario: Cache metrics

- **WHEN** 缓存操作执行
- **THEN** 记录 `cache_hits_total` 计数器
- **AND** 记录 `cache_misses_total` 计数器

#### Scenario: Queue metrics

- **WHEN** 队列任务处理
- **THEN** 记录 `queue_jobs_total` 计数器（按 queue_name、status 分组）

---

### Requirement: Configuration Dependencies

基础设施模块 SHALL 依赖以下配置项：

| 模块        | 配置前缀      | 关键配置                          |
| ----------- | ------------- | --------------------------------- |
| Cache/Queue | `redis.*`     | enabled, host, port, password, db |
| Throttler   | `throttler.*` | enabled, ttl, limit               |
| Metrics     | `metrics.*`   | enabled, path, defaultLabels      |

#### Scenario: Redis configuration

- **WHEN** Redis 相关模块初始化
- **THEN** 从 `redis.enabled` 判断是否启用
- **AND** 从 `redis.host`, `redis.port`, `redis.password`, `redis.db` 读取连接信息

#### Scenario: Missing configuration

- **WHEN** 配置项缺失
- **THEN** 使用合理的默认值
- **AND** 不影响应用启动

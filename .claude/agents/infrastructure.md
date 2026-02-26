# 基础设施开发规范

> 依赖：[common-patterns](./common-patterns.md)

## 基础设施模块一览

| 模块        | 位置                                       | 用途                 |
| ----------- | ------------------------------------------ | -------------------- |
| Database    | `src/infrastructure/database/`             | TypeORM + PostgreSQL |
| Cache       | `src/infrastructure/cache/`                | Redis 缓存           |
| Queue       | `src/infrastructure/queue/`                | BullMQ 任务队列      |
| Redis       | `src/infrastructure/redis/`                | Redis 连接配置       |
| Logger      | `src/infrastructure/logger/`               | Pino 结构化日志      |
| Health      | `src/infrastructure/health/`               | 健康检查端点         |
| Metrics     | `src/infrastructure/metrics/`              | Prometheus 指标      |
| Audit       | `src/infrastructure/audit/`                | 审计日志             |
| Throttler   | `src/infrastructure/throttler/`            | 请求限流             |
| Scheduler   | `src/infrastructure/scheduler/`            | 定时任务             |
| Transaction | `src/infrastructure/database/transaction/` | 事务管理             |

## 缓存模块

### 使用方式

项目使用 `@nestjs/cache-manager`，通过 `CACHE_MANAGER` Token 注入：

```typescript
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class FeatureService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async getById(id: number): Promise<Feature> {
    const cacheKey = `feature:${id}`;
    const cached = await this.cacheManager.get<Feature>(cacheKey);
    if (cached) return cached;

    const feature = await this.featureRepository.findById(id);
    if (feature) {
      await this.cacheManager.set(cacheKey, feature, 3600000); // TTL: 毫秒
    }
    return feature;
  }
}
```

### 配置

- `REDIS_ENABLED=true` — 启用 Redis 缓存
- `CACHE_TTL_MS` — 默认 TTL（毫秒）
- `CacheModule` 是 `@Global()` 模块，无需在每个模块中 import
- Redis 不可用时自动降级为内存缓存

## 任务队列（BullMQ）

### 定义 Processor

```typescript
@Processor('mail')
export class MailProcessor extends WorkerHost {
  async process(job: Job<MailJobData>): Promise<void> {
    await this.mailService.send(job.data);
  }
}
```

### 添加任务

```typescript
@Injectable()
export class MailQueueService {
  constructor(@InjectQueue('mail') private readonly mailQueue: Queue) {}

  async addSendEmailJob(data: MailJobData): Promise<void> {
    await this.mailQueue.add('send-email', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
    });
  }
}
```

## 日志模块（Pino）

### 使用方式

```typescript
@Injectable()
export class FeatureService {
  private readonly logger = new Logger(FeatureService.name);

  async create(dto: CreateFeatureDto) {
    this.logger.log(`创建功能: ${dto.name}`);
    this.logger.warn('警告信息');
    this.logger.error('错误信息', error.stack);
  }
}
```

### 配置

- `LOG_LEVEL` — debug, info, warn, error
- `LOG_PRETTY_PRINT` — 开发环境可读格式
- 自动脱敏：authorization, cookie, password, token, email, phone
- 请求 ID 追踪：通过 `x-request-id` Header

## 健康检查

```
GET /health       — 总体健康状态
GET /health/live  — 存活探针（Kubernetes liveness）
GET /health/ready — 就绪探针（Kubernetes readiness）
```

## Prometheus 指标

```
GET /metrics      — Prometheus 指标端点
```

### 配置

- `METRICS_ENABLED=true` — 启用指标收集
- `METRICS_PATH=metrics` — 指标端点路径
- 自动采集：HTTP 请求延迟、请求计数、错误率

## 请求限流（Throttler）

```typescript
// 全局配置（默认）
THROTTLE_ENABLED=true
THROTTLE_TTL=60       // 60 秒窗口
THROTTLE_LIMIT=100    // 最多 100 次请求

// 单个端点自定义
@Throttle({ default: { limit: 5, ttl: 60 } })
@Post('login')
login() { ... }

// 跳过限流
@SkipThrottle()
@Get('health')
health() { ... }
```

## 定时任务

```typescript
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CleanupScheduler {
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanExpiredSessions() {
    // 每天清理过期会话
  }
}
```

## 审计日志

自动记录关键操作（通过 Interceptor）：

- 用户操作（创建、更新、删除）
- 认证事件（登录、登出、密码修改）
- 管理操作

## 添加新基础设施模块

1. 在 `src/infrastructure/` 下创建模块目录
2. 创建配置文件 `config/xxx.config.ts` + `config/xxx-config.type.ts`
3. 在 `AllConfigType` 中注册配置类型
4. 在 `AppModule` 中导入配置和模块
5. 添加对应的环境变量到 `.env`

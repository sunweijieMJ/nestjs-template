# 配置开发规范

> 依赖：[infrastructure](./infrastructure.md)

## 配置系统架构

```
src/config/
├── config.type.ts        # AllConfigType（聚合所有配置类型）
└── app.config.ts          # 应用基础配置

src/xxx/config/
├── xxx.config.ts          # 配置注册（registerAs）
└── xxx-config.type.ts     # 配置类型接口
```

## 新增配置模块步骤

### 1. 定义配置类型

```typescript
// src/modules/feature/config/feature-config.type.ts
export type FeatureConfig = {
  enabled: boolean;
  maxItems: number;
  apiEndpoint: string;
};
```

### 2. 创建配置注册

```typescript
// src/modules/feature/config/feature.config.ts
import { registerAs } from '@nestjs/config';
import { IsBoolean, IsNumber, IsString, IsOptional } from 'class-validator';
import validateConfig from '@/common/validate-config';
import { FeatureConfig } from './feature-config.type';

class EnvironmentVariablesValidator {
  @IsBoolean()
  @IsOptional()
  FEATURE_ENABLED: boolean;

  @IsNumber()
  @IsOptional()
  FEATURE_MAX_ITEMS: number;

  @IsString()
  @IsOptional()
  FEATURE_API_ENDPOINT: string;
}

export default registerAs<FeatureConfig>('feature', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    enabled: process.env.FEATURE_ENABLED === 'true',
    maxItems: process.env.FEATURE_MAX_ITEMS ? parseInt(process.env.FEATURE_MAX_ITEMS, 10) : 100,
    apiEndpoint: process.env.FEATURE_API_ENDPOINT || 'https://api.example.com',
  };
});
```

### 3. 注册到 AllConfigType

```typescript
// src/config/config.type.ts
import { FeatureConfig } from '../modules/feature/config/feature-config.type';

export type AllConfigType = {
  app: AppConfig;
  auth: AuthConfig;
  // ... 其他配置
  feature: FeatureConfig; // 新增
};
```

### 4. 在 AppModule 中加载

```typescript
// src/app.module.ts
import featureConfig from './modules/feature/config/feature.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        // ... 其他配置
        featureConfig, // 新增
      ],
    }),
  ],
})
export class AppModule {}
```

### 5. 添加环境变量

```env
# .env
FEATURE_ENABLED=true
FEATURE_MAX_ITEMS=100
FEATURE_API_ENDPOINT=https://api.example.com
```

## 使用配置

```typescript
@Injectable()
export class FeatureService {
  constructor(private readonly configService: ConfigService<AllConfigType>) {}

  getMaxItems(): number {
    // ✅ 正确 - 使用 { infer: true } 获得类型推断
    return this.configService.get('feature.maxItems', { infer: true });
  }

  getEndpoint(): string {
    // ✅ 正确 - 使用 getOrThrow 确保配置存在
    return this.configService.getOrThrow('feature.apiEndpoint', { infer: true });
  }
}
```

## 配置验证规则

1. **必填项**使用 `@IsString()` / `@IsNumber()` 等（无 `@IsOptional`）— 启动时缺失会报错
2. **可选项**使用 `@IsOptional()` — 缺失时使用代码中的默认值
3. **环境变量验证在应用启动时执行** — 缺失必填配置会阻止启动

## 已有配置模块

| 命名空间    | 文件                                                      | 主要配置项                               |
| ----------- | --------------------------------------------------------- | ---------------------------------------- |
| `app`       | `src/config/app.config.ts`                                | port, apiPrefix, frontendDomain, nodeEnv |
| `auth`      | `src/core/auth/config/auth.config.ts`                     | jwtSecret, tokenExpires, refreshExpires  |
| `database`  | `src/infrastructure/database/config/database.config.ts`   | host, port, username, password, name     |
| `file`      | `src/modules/files/config/file.config.ts`                 | driver (local/s3), s3 配置               |
| `mail`      | `src/integrations/mail/config/mail.config.ts`             | host, port, user, password               |
| `logger`    | `src/infrastructure/logger/config/logger.config.ts`       | level, prettyPrint                       |
| `redis`     | `src/infrastructure/redis/config/redis.config.ts`         | enabled, host, port                      |
| `throttler` | `src/infrastructure/throttler/config/throttler.config.ts` | enabled, ttl, limit                      |
| `metrics`   | `src/infrastructure/metrics/config/metrics.config.ts`     | enabled, path                            |
| `sms`       | `src/integrations/sms/config/sms.config.ts`               | accessKeyId, signName, templateCode      |
| `wechat`    | `src/integrations/wechat/config/wechat.config.ts`         | appId, mchId, apiKey                     |
| `alipay`    | `src/integrations/alipay/config/alipay.config.ts`         | appId, privateKey, publicKey             |

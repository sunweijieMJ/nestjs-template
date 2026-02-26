---
name: config-generator
description: 生成类型安全的配置模块
triggers:
  - '生成配置'
  - '新建配置'
  - '添加配置'
  - 'create config'
---

# 配置模块生成器

生成遵循项目规范的类型安全配置。

## 输入

- **配置命名空间**：如 `feature`
- **所属模块路径**：如 `src/modules/feature`
- **配置项列表**：变量名、类型、默认值、是否必填

## 生成文件

### 1. 配置类型（`config/{name}-config.type.ts`）

```typescript
export type FeatureConfig = {
  enabled: boolean;
  maxItems: number;
  apiEndpoint: string;
};
```

### 2. 配置注册（`config/{name}.config.ts`）

```typescript
import { registerAs } from '@nestjs/config';
import { IsBoolean, IsNumber, IsString, IsOptional } from 'class-validator';
import validateConfig from '@/common/utils/validate-config';
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

## 后续步骤

生成后需要手动完成：

1. 在 `AllConfigType` 中注册：`feature: FeatureConfig`
2. 在 `AppModule` 的 `ConfigModule.forRoot.load` 中添加 `featureConfig`
3. 在 `.env` 中添加环境变量

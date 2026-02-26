# 模块开发规范

> 依赖：[common-patterns](./common-patterns.md)

## 模块分类

### 核心模块（`src/core/`）

系统级功能，其他模块可能依赖：

- `auth` - 认证
- `users` - 用户管理
- `session` - 会话管理
- `permissions` - 权限管理

### 业务模块（`src/modules/`）

具体业务功能，相互独立：

- `addresses`, `orders`, `files`, `notifications`, `feedbacks`, `favorites`, `shares`, `regions`, `config`

### 基础设施模块（`src/infrastructure/`）

技术支撑，不含业务逻辑：

- `database`, `cache`, `queue`, `redis`, `logger`, `health`, `metrics`, `audit`, `throttler`, `scheduler`

### 集成模块（`src/integrations/`）

外部服务对接：

- `mail`, `sms`, `wechat`, `alipay`

## 新建模块步骤

### 1. 创建目录结构

```
src/modules/feature/
├── domain/feature.ts
├── dto/
│   ├── create-feature.dto.ts
│   ├── update-feature.dto.ts
│   └── query-feature.dto.ts
├── infrastructure/persistence/
│   ├── feature.repository.ts
│   └── relational/
│       ├── entities/feature.entity.ts
│       ├── mappers/feature.mapper.ts
│       ├── repositories/feature.repository.ts
│       └── relational-persistence.module.ts
├── feature.controller.ts
├── feature.service.ts
└── feature.module.ts
```

### 2. 自底向上实现

1. **Domain Entity** → 定义业务属性（无框架装饰器）
2. **Persistence Entity** → TypeORM 实体（数据库映射）
3. **Mapper** → `toDomain()` / `toPersistence()`
4. **Repository Port** → 抽象类定义接口
5. **Repository Implementation** → TypeORM 实现
6. **Persistence Module** → `provide: Port, useClass: Implementation`
7. **DTOs** → 创建/更新/查询 DTO（class-validator）
8. **Service** → 业务逻辑（注入抽象 Repository）
9. **Controller** → HTTP 路由（注入 Service）
10. **Module** → 组装并导出

### 3. 注册到 AppModule

```typescript
// src/app.module.ts
import { FeatureModule } from './modules/feature/feature.module';

@Module({
  imports: [
    // ... 其他模块
    FeatureModule,
  ],
})
export class AppModule {}
```

## 模块间通信

```typescript
// ✅ 正确 - 通过 Module imports 引入，注入 Service
@Module({
  imports: [RegionsModule], // 引入整个模块
})
export class AddressesModule {}

// Service 中注入
constructor(private readonly regionsService: RegionsService) {}

// ❌ 错误 - 直接导入其他模块的内部文件
import { RegionEntity } from '../regions/infrastructure/persistence/...';
```

## 模块导出原则

```typescript
@Module({
  imports: [RelationalFeaturePersistenceModule],
  controllers: [FeatureController],
  providers: [FeatureService],
  exports: [FeatureService, RelationalFeaturePersistenceModule], // 仅导出需要的
})
export class FeatureModule {}
```

- **总是导出** Service（其他模块可能需要调用）
- **总是导出** PersistenceModule（其他模块可能需要关联查询）
- **不导出** Controller（仅通过 HTTP 访问）

## 使用 Hygen 生成

```bash
pnpm generate:resource:relational
# 交互式输入模块名、属性等，自动生成完整结构

pnpm add:property:to-relational
# 为已有模块添加新属性
```

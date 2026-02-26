# 通用模式（Single Source of Truth）

> 所有其他 Agent 引用此文件中的模式。修改通用模式时，此文件是唯一权威来源。

## 1. 模块结构模式

每个业务模块遵循六边形架构：

```
feature/
├── domain/
│   └── feature.ts                    # 纯业务实体
├── dto/
│   ├── create-feature.dto.ts         # 创建 DTO
│   ├── update-feature.dto.ts         # 更新 DTO
│   └── query-feature.dto.ts          # 查询 DTO
├── infrastructure/
│   └── persistence/
│       ├── feature.repository.ts     # 仓储接口（抽象类）
│       └── relational/
│           ├── entities/
│           │   └── feature.entity.ts # TypeORM 实体
│           ├── mappers/
│           │   └── feature.mapper.ts # Domain ↔ Entity 映射
│           ├── repositories/
│           │   └── feature.repository.ts  # 仓储实现
│           └── relational-persistence.module.ts
├── feature.controller.ts
├── feature.service.ts
└── feature.module.ts
```

## 2. 依赖注入模式

```typescript
// 仓储接口（Port）- 使用抽象类而非 interface（NestJS DI 需要）
export abstract class FeatureRepository {
  abstract create(data: Omit<Feature, 'id' | 'createdAt' | 'updatedAt'>): Promise<Feature>;
  abstract findById(id: Feature['id']): Promise<NullableType<Feature>>;
  abstract findManyWithPagination(options: {
    filterOptions?: FilterDto | null;
    sortOptions?: SortDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Feature[]>;
  abstract update(id: Feature['id'], payload: DeepPartial<Feature>): Promise<Feature | null>;
  abstract remove(id: Feature['id']): Promise<void>;
}

// 模块绑定
@Module({
  imports: [TypeOrmModule.forFeature([FeatureEntity])],
  providers: [
    {
      provide: FeatureRepository,
      useClass: FeatureRelationalRepository,
    },
  ],
  exports: [FeatureRepository],
})
export class RelationalFeaturePersistenceModule {}
```

## 3. Mapper 模式

```typescript
export class FeatureMapper {
  static toDomain(raw: FeatureEntity): Feature {
    const domain = new Feature();
    domain.id = raw.id;
    // 映射所有属性...
    // 映射关联实体时调用对应的 Mapper
    return domain;
  }

  static toPersistence(domain: Feature): FeatureEntity {
    const entity = new FeatureEntity();
    entity.id = domain.id;
    // 映射所有属性...
    return entity;
  }
}
```

## 4. Service 模式

```typescript
@Injectable()
export class FeatureService {
  private readonly logger = new Logger(FeatureService.name);

  constructor(
    private readonly featureRepository: FeatureRepository, // 注入抽象，不是实现
  ) {}

  async create(dto: CreateFeatureDto): Promise<Feature> {
    // 业务验证逻辑...
    return this.featureRepository.create(dto);
  }

  async findManyWithPagination(query: QueryFeatureDto): Promise<Feature[]> {
    return this.featureRepository.findManyWithPagination({
      paginationOptions: { page: query.page, limit: query.limit },
    });
  }
}
```

## 5. Controller 模式

```typescript
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Features')
@Controller({ path: 'features', version: '1' })
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: Feature })
  create(@Body() dto: CreateFeatureDto): Promise<Feature> {
    return this.featureService.create(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: QueryFeatureDto): Promise<InfinityPaginationResponseDto<Feature>> {
    return infinityPagination(await this.featureService.findManyWithPagination(query), {
      page: query.page,
      limit: query.limit,
    });
  }
}
```

## 6. DTO 验证模式

```typescript
export class CreateFeatureDto {
  @ApiProperty({ example: 'Feature Name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
```

**规则**：

- 所有外部输入必须通过 DTO + class-validator 验证
- 使用 `@ApiProperty` / `@ApiPropertyOptional` 装饰 Swagger 文档
- DTO 中使用 `@Transform` 进行数据清洗（trim, lowercase 等）

## 7. 配置使用模式

```typescript
// ✅ 正确 - 使用 ConfigService 并传入 { infer: true }
const secret = this.configService.get('auth.secret', { infer: true });

// ❌ 错误 - 直接使用环境变量
const secret = process.env.AUTH_JWT_SECRET;

// ❌ 错误 - 缺少 { infer: true }
const secret = this.configService.get('auth.secret');
```

## 8. 错误处理模式

```typescript
// Service 层抛出业务异常
import { UnprocessableEntityException, NotFoundException } from '@nestjs/common';

// 使用 i18n key 作为 message（由 AllExceptionsFilter 自动翻译）
throw new UnprocessableEntityException('emailAlreadyExists');
throw new NotFoundException('userNotFound');
```

## 9. 导入顺序

```typescript
// 1. NestJS 核心
import { Injectable, Logger } from '@nestjs/common';
// 2. NestJS 扩展
import { ConfigService } from '@nestjs/config';
// 3. 第三方库
import { InjectRepository } from '@nestjs/typeorm';
// 4. 项目内 - 共享
import { NullableType } from '@/common/types/nullable.type';
// 5. 项目内 - 同模块
import { Feature } from '../domain/feature';
```

## 10. 快速检查清单

- [ ] Domain 实体无 TypeORM 装饰器
- [ ] Service 注入的是抽象 Repository
- [ ] Mapper 存在且双向映射完整
- [ ] DTO 有 class-validator + Swagger 装饰器
- [ ] Controller 仅做路由转发，不含业务逻辑
- [ ] 配置使用 `configService.get('xxx', { infer: true })`
- [ ] 错误消息使用 i18n key
- [ ] Module 正确 exports 需要暴露的 Provider

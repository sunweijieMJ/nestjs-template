# 编码规范

> 依赖：[common-patterns](./common-patterns.md)

## TypeScript 规范

### 类型安全

```typescript
// ✅ 正确 - 明确类型
const userId: number = request.user.id;
const user: NullableType<User> = await this.findById(id);

// ❌ 错误 - any 类型
const data: any = response.body;

// ✅ 正确 - 使用 unknown 代替 any
const data: unknown = JSON.parse(body);
```

### 空值处理

```typescript
// 项目自定义的 NullableType
type NullableType<T> = T | null;

// ✅ 使用 NullableType 表示可能为 null 的返回值
async findById(id: number): Promise<NullableType<Feature>> {
  const entity = await this.repo.findOne({ where: { id } });
  return entity ? FeatureMapper.toDomain(entity) : null;
}
```

### 枚举

```typescript
// 使用 const enum 或字符串枚举
export enum RoleEnum {
  admin = 1,
  user = 2,
}

export enum Permission {
  USER_CREATE = 'user.create',
  USER_READ = 'user.read',
}
```

## NestJS 规范

### 依赖注入

```typescript
// ✅ 正确 - 构造函数注入
@Injectable()
export class FeatureService {
  constructor(
    private readonly featureRepository: FeatureRepository,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}
}

// ❌ 错误 - 属性注入（难以测试）
@Injectable()
export class FeatureService {
  @Inject() featureRepository: FeatureRepository;
}
```

### 命名规范

| 类型        | 规范                       | 示例                    |
| ----------- | -------------------------- | ----------------------- |
| Module      | `PascalCase` + Module      | `UsersModule`           |
| Controller  | `PascalCase` + Controller  | `UsersController`       |
| Service     | `PascalCase` + Service     | `UsersService`          |
| Guard       | `PascalCase` + Guard       | `PermissionsGuard`      |
| Interceptor | `PascalCase` + Interceptor | `ResponseInterceptor`   |
| Pipe        | `PascalCase` + Pipe        | `ValidationPipe`        |
| Filter      | `PascalCase` + Filter      | `AllExceptionsFilter`   |
| Decorator   | `camelCase`                | `@RequirePermissions()` |
| DTO         | `PascalCase` + Dto         | `CreateUserDto`         |
| Entity      | `PascalCase` + Entity      | `UserEntity`            |
| Domain      | `PascalCase`               | `User`                  |

### 文件命名

```
feature.module.ts
feature.controller.ts
feature.service.ts
feature.entity.ts
feature.mapper.ts
feature.repository.ts
create-feature.dto.ts
query-feature.dto.ts
```

规则：`kebab-case` + `.type.ts` 后缀

### Logger 使用

```typescript
// 每个 Injectable 类使用独立 Logger
private readonly logger = new Logger(FeatureService.name);

// 日志级别
this.logger.log('信息');     // info
this.logger.warn('警告');    // warn
this.logger.error('错误', error.stack); // error（包含堆栈）
this.logger.debug('调试');   // debug
```

## 代码风格

### ESLint + Prettier

```bash
pnpm lint        # 检查
pnpm lint:fix    # 自动修复
pnpm format      # Prettier 格式化
```

### Prettier 配置

- 分号：有（`semi: true`）
- 引号：单引号（`singleQuote: true`）
- 行宽：120（`printWidth: 120`）
- 尾逗号：全部（`trailingComma: 'all'`）
- Tab：2 空格（`tabWidth: 2`）

### 关键 ESLint 规则

- `@typescript-eslint/no-explicit-any`: warn — 尽量不用 `any`
- ConfigService 必须传 `{ infer: true }`
- 不允许未使用的变量（除 `_` 前缀）
- Jest 测试文件不检查 any

## 错误处理

```typescript
// ✅ 正确 - 使用 NestJS 内置异常
throw new NotFoundException('userNotFound');
throw new UnprocessableEntityException('emailAlreadyExists');
throw new ForbiddenException('insufficientPermissions');

// ❌ 错误 - 抛出原生错误
throw new Error('User not found');

// ❌ 错误 - 在 Controller 中 try-catch
@Get(':id')
async findOne(@Param('id') id: number) {
  try {
    return await this.service.findById(id);
  } catch (e) { // 不需要，AllExceptionsFilter 会统一处理
    throw e;
  }
}
```

## 异步模式

```typescript
// ✅ 正确 - async/await
async findById(id: number): Promise<NullableType<Feature>> {
  return this.featureRepository.findById(id);
}

// ✅ 正确 - 并发操作
const [users, total] = await Promise.all([
  this.userRepository.findMany(options),
  this.userRepository.count(options),
]);
```

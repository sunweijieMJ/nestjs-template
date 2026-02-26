# 测试策略

> 依赖：[common-patterns](./common-patterns.md)

## 测试框架

- **单元测试**: Jest + ts-jest
- **E2E 测试**: Jest + Supertest
- **覆盖率**: Jest Coverage（60% 阈值）

## 单元测试

### 文件位置

与被测文件同目录，命名 `*.spec.ts`：

```
src/modules/feature/
├── feature.service.ts
├── feature.service.spec.ts    # 单元测试
└── feature.controller.ts
```

### Service 测试模式

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureService } from './feature.service';
import { FeatureRepository } from './infrastructure/persistence/feature.repository';

describe('FeatureService', () => {
  let service: FeatureService;
  let repository: jest.Mocked<FeatureRepository>;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findManyWithPagination: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [FeatureService, { provide: FeatureRepository, useValue: mockRepository }],
    }).compile();

    service = module.get<FeatureService>(FeatureService);
    repository = module.get(FeatureRepository);
  });

  describe('create', () => {
    it('应该创建并返回功能', async () => {
      const dto = { name: '测试功能' };
      const expected = { id: 1, name: '测试功能', createdAt: new Date() };
      repository.create.mockResolvedValue(expected as any);

      const result = await service.create(dto);

      expect(result).toEqual(expected);
      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining(dto));
    });
  });

  describe('findById', () => {
    it('存在时应返回功能', async () => {
      const expected = { id: 1, name: '测试功能' };
      repository.findById.mockResolvedValue(expected as any);

      const result = await service.findById(1);

      expect(result).toEqual(expected);
    });

    it('不存在时应返回 null', async () => {
      repository.findById.mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });
});
```

### 测试规则

1. **Mock 所有外部依赖** — Repository, ConfigService, 其他 Service
2. **测试业务逻辑** — 验证、转换、条件分支
3. **测试异常场景** — 不存在、重复、权限不足
4. **描述使用中文** — `it('应该创建并返回功能')`

## E2E 测试

### 文件位置

```
test/
├── user/
│   └── auth.e2e-spec.ts
├── utils/
│   └── ...
└── jest-e2e.json
```

### E2E 测试模式

```typescript
import request from 'supertest';
import { APP_URL } from '../utils/constants';

describe('Auth (e2e)', () => {
  const app = APP_URL;

  describe('POST /api/v1/auth/email/login', () => {
    it('应该成功登录', async () => {
      const response = await request(app)
        .post('/api/v1/auth/email/login')
        .send({
          email: 'admin@example.com',
          password: 'secret',
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('密码错误应返回 422', async () => {
      await request(app)
        .post('/api/v1/auth/email/login')
        .send({
          email: 'admin@example.com',
          password: 'wrong-password',
        })
        .expect(422);
    });
  });
});
```

### 运行 E2E 测试

```bash
# 需要先启动数据库和应用
make dev                 # 启动 Docker 开发环境
pnpm test:e2e         # 运行 E2E 测试

# 或使用 Docker CI 环境
make ci                  # 自动启动环境并运行测试
```

## 运行命令

```bash
pnpm test             # 运行所有单元测试
pnpm test:watch       # 监听模式
pnpm test:cov         # 生成覆盖率报告
pnpm test:e2e         # 运行 E2E 测试
pnpm test:debug       # 调试模式
```

## 测试覆盖率

- **目标**: 60% 以上
- **重点覆盖**: Service 层业务逻辑、Guard/Interceptor、工具函数
- **可选覆盖**: Controller（薄层，E2E 测试覆盖）、Entity/Mapper（简单映射）

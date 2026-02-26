---
name: test-generator
description: 生成单元测试和 E2E 测试
triggers:
  - '生成测试'
  - '写测试'
  - '添加测试'
  - 'create test'
  - 'generate test'
---

# 测试生成器

为 Service / Controller / Guard 等生成测试代码。

## 输入

- **目标文件**：如 `src/modules/products/products.service.ts`
- **测试类型**：单元测试 / E2E 测试

## 单元测试模版（Service）

```typescript
import { Test, TestingModule } from '@nestjs/testing';

describe('{Feature}Service', () => {
  let service: {Feature}Service;
  let repository: jest.Mocked<{Feature}Repository>;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findManyWithPagination: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {Feature}Service,
        { provide: {Feature}Repository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get({Feature}Service);
    repository = module.get({Feature}Repository);
  });

  // 为每个 public 方法生成：
  // - 正常场景
  // - 异常场景（not found, duplicate, invalid input）
});
```

## E2E 测试模版

```typescript
import request from 'supertest';
import { APP_URL } from '../utils/constants';

describe('{Feature} (e2e)', () => {
  const app = APP_URL;
  let token: string;

  beforeAll(async () => {
    // 登录获取 token
    const response = await request(app)
      .post('/api/v1/auth/email/login')
      .send({ email: 'admin@example.com', password: 'secret' });
    token = response.body.data.token;
  });

  describe('POST /api/v1/{features}', () => {
    it('应该创建成功', async () => {
      const response = await request(app)
        .post('/api/v1/{features}')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '测试' })
        .expect(201);
      expect(response.body.data).toHaveProperty('id');
    });
  });
});
```

## 测试规则

1. **描述使用中文**
2. **Mock 所有外部依赖**
3. **覆盖正常 + 异常路径**
4. **E2E 测试需要真实数据库环境**

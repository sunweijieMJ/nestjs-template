---
name: api-endpoint-generator
description: 生成 REST API 端点（Controller + DTO + Swagger）
triggers:
  - '生成接口'
  - '新建端点'
  - '添加 API'
  - 'create endpoint'
---

# API 端点生成器

为已有模块生成 REST API 端点。

## 输入

- **模块名称**：如 `products`
- **端点类型**：CRUD（全部）或 指定（如仅 GET list + GET detail）
- **是否需要认证**：默认需要
- **权限要求**：如 `Permission.PRODUCT_CREATE`

## 生成的端点

### 标准 CRUD

| 方法   | 路径                   | 状态码 | 说明     |
| ------ | ---------------------- | ------ | -------- |
| POST   | `/api/v1/features`     | 201    | 创建     |
| GET    | `/api/v1/features`     | 200    | 分页列表 |
| GET    | `/api/v1/features/:id` | 200    | 详情     |
| PATCH  | `/api/v1/features/:id` | 200    | 更新     |
| DELETE | `/api/v1/features/:id` | 204    | 删除     |

## Controller 模版

```typescript
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('{Features}')
@Controller({ path: '{features}', version: '1' })
export class {Feature}Controller {
  constructor(private readonly {feature}Service: {Feature}Service) {}
  // CRUD 方法...
}
```

## DTO 模版

- **CreateDto**: class-validator 验证 + @ApiProperty
- **UpdateDto**: `extends PartialType(CreateDto)`
- **QueryDto**: `extends PaginationQueryDto` + 可选搜索/排序字段

## Swagger 装饰器清单

每个端点必须包含：

- `@HttpCode(HttpStatus.XXX)` — 明确状态码
- `@ApiXxxResponse({ type: Xxx })` — 响应类型
- `@ApiBearerAuth()` — 认证标记（Controller 级别）

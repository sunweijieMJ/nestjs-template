# API 端点开发规范

> 依赖：[common-patterns](./common-patterns.md)

## Controller 规范

### 标准 CRUD Controller

```typescript
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Features')
@Controller({ path: 'features', version: '1' })
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'createFeature', summary: '创建功能' })
  @ApiOkResponse({ type: Feature })
  create(@Body() dto: CreateFeatureDto): Promise<Feature> {
    return this.featureService.create(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'getFeatures', summary: '功能列表' })
  @ApiOkResponse({ type: PaginationResponse(Feature) })
  async findAll(@Query() query: QueryFeatureDto): Promise<PaginationResponseDto<Feature>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 50);
    const { data, total } = await this.featureService.findManyWithPaginationAndCount({
      paginationOptions: { page, limit },
    });
    return pagination(data, total, { page, limit });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'getFeature', summary: '功能详情' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: Feature })
  findOne(@Param('id', ParseIdPipe) id: number): Promise<Feature> {
    return this.featureService.findOne(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'updateFeature', summary: '更新功能' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: Feature })
  update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateFeatureDto): Promise<Feature> {
    return this.featureService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'deleteFeature', summary: '删除功能' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id', ParseIdPipe) id: number): Promise<void> {
    return this.featureService.remove(id);
  }
}
```

### Controller 规则

1. **薄层原则**：Controller 仅做路由转发 + 参数提取
2. **版本控制**：`@Controller({ path: 'xxx', version: '1' })`
3. **HTTP 状态码**：使用 `@HttpCode()` 显式指定；成功响应统一 200，由 ResponseInterceptor 包装
4. **路径参数**：自增主键用 `@Param('id', ParseIdPipe)`，非法值返回 400
5. **更新方法**：使用 `@Put`，`@ApiOperation` 必须带 `operationId`
6. **Swagger 装饰器**：每个端点都需要 `@ApiResponse` 类装饰器
7. **认证保护**：默认添加 `@ApiBearerAuth()` + `@UseGuards(AuthGuard('jwt'))`；管理端点使用 `PermissionsGuard` + `@RequirePermissions()`

## DTO 规范

### 创建 DTO

```typescript
export class CreateFeatureDto {
  @ApiProperty({ example: '功能名称' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiPropertyOptional({ example: '功能描述' })
  @IsOptional()
  @IsString()
  description?: string;
}
```

### 更新 DTO（使用 PartialType）

```typescript
export class UpdateFeatureDto extends PartialType(CreateFeatureDto) {}
```

### 查询 DTO（分页 + Filter + Sort）

```typescript
export class FilterFeatureDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class SortFeatureDto {
  @ApiProperty()
  @IsString()
  orderBy: keyof Feature;

  @ApiProperty()
  @IsString()
  order: string;
}

export class QueryFeatureDto {
  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @Transform(({ value }) => (value ? plainToInstance(FilterFeatureDto, JSON.parse(value)) : undefined))
  @ValidateNested()
  @Type(() => FilterFeatureDto)
  filters?: FilterFeatureDto | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @Transform(({ value }) => (value ? plainToInstance(SortFeatureDto, JSON.parse(value)) : undefined))
  @ValidateNested({ each: true })
  @Type(() => SortFeatureDto)
  sort?: SortFeatureDto[] | null;
}
```

### DTO 规则

- 所有字段必须有 `@ApiProperty` 或 `@ApiPropertyOptional`
- 使用 `@Transform` 做数据清洗（trim, toLowerCase 等）
- 可选字段标注 `@IsOptional()`
- 敏感字段使用自定义 validator（如 `@IsPasswordStrong()`）

## Swagger 文档

### 访问地址

- Swagger UI: `GET /docs`
- OpenAPI JSON: `GET /docs-json`

### 文档装饰器

```typescript
@ApiTags('Features')              // 分组
@ApiBearerAuth()                  // 认证标记
@ApiCreatedResponse({ type: X })  // 201 响应
@ApiOkResponse({ type: X })       // 200 响应
@ApiNoContentResponse()           // 204 响应
@ApiNotFoundResponse()            // 404 响应
@ApiUnprocessableEntityResponse() // 422 响应
```

## 响应格式

所有响应由 `ResponseInterceptor` 自动包装：

```json
// 成功
{ "code": 200, "message": "success", "data": { ... } }

// 错误
{ "code": 422, "message": "emailAlreadyExists", "data": null }

// 验证错误
{ "code": 422, "message": ["name should not be empty"], "data": null }
```

### 跳过包装

```typescript
@SkipResponseTransform()
@Get('raw')
getRawData() {
  return { custom: 'format' };
}
```

## 分页响应

```typescript
// src/modules/feature/feature.controller.ts
import { pagination } from '../../common/pagination';
import { PaginationResponse, PaginationResponseDto } from '../../common/dto/pagination-response.dto';

// 返回格式
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [...],
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

## 获取当前用户

```typescript
@Get('me')
getProfile(@Request() request): Promise<User> {
  return this.usersService.findById(request.user.id);
}
```

---
name: guard-interceptor-generator
description: 生成 Guard / Interceptor / Pipe / Decorator
triggers:
  - '生成守卫'
  - '生成拦截器'
  - '生成管道'
  - 'create guard'
  - 'create interceptor'
---

# Guard / Interceptor / Pipe 生成器

生成 NestJS 中间件组件。

## Guard 模版

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class {Name}Guard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    // 1. 从 Reflector 获取元数据
    // 2. 从 Request 获取用户信息
    // 3. 执行权限判断
    return true;
  }
}
```

## Interceptor 模版

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable()
export class {Name}Interceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 前置逻辑
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        // 后置逻辑
        console.log(`耗时: ${Date.now() - now}ms`);
      }),
    );
  }
}
```

## Pipe 模版

```typescript
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class {Name}Pipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException('验证失败');
    }
    return val;
  }
}
```

## 自定义 Decorator 模版

```typescript
import { SetMetadata } from '@nestjs/common';

export const {NAME}_KEY = '{name}_key';
export const {Name} = (...args: string[]) => SetMetadata({NAME}_KEY, args);
```

## 注册方式

- **全局**：在 `main.ts` 中 `app.useGlobalXxx()`
- **Controller 级**：`@UseGuards()` / `@UseInterceptors()`
- **方法级**：同上，放在方法装饰器上
- **Module 级**：在 Module providers 中使用 `APP_GUARD` / `APP_INTERCEPTOR` Token

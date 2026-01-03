import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditService } from './audit.service';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { RelationalAuditPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

/**
 * AuditModule provides audit logging capabilities for the application.
 *
 * Features:
 * - Automatic audit logging via @Auditable() decorator
 * - Sensitive data redaction (passwords, tokens, etc.)
 * - Request context tracking (IP, user agent, request ID)
 * - Flexible querying by entity, user, or time range
 *
 * @example
 * Using @Auditable() decorator:
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Put(':id')
 *   @Auditable({ action: AuditAction.UPDATE, entityType: 'User' })
 *   async update(@Param('id') id: number, @Body() dto: UpdateUserDto) {
 *     return this.userService.update(id, dto);
 *   }
 * }
 * ```
 *
 * @example
 * Using AuditService directly:
 * ```typescript
 * @Injectable()
 * export class AuthService {
 *   constructor(private auditService: AuditService) {}
 *
 *   async login(dto: LoginDto, request: Request) {
 *     const user = await this.validateUser(dto);
 *     await this.auditService.log({
 *       userId: user.id,
 *       action: AuditAction.LOGIN,
 *       entityType: 'User',
 *       entityId: user.id,
 *       request,
 *     });
 *     return user;
 *   }
 * }
 * ```
 */
@Global()
@Module({
  imports: [RelationalAuditPersistenceModule],
  providers: [
    AuditService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [AuditService],
})
export class AuditModule {}

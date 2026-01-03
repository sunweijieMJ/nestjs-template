import { SetMetadata } from '@nestjs/common';
import { AuditAction } from '../domain/audit-log';

export interface AuditableOptions {
  /**
   * The action type for this audit log
   */
  action: AuditAction;

  /**
   * The entity type being audited (e.g., 'User', 'Address')
   */
  entityType: string;

  /**
   * The name of the route parameter containing the entity ID
   * @default 'id'
   */
  idParam?: string;

  /**
   * Whether to include the request body in the audit log
   * @default true
   */
  includeBody?: boolean;

  /**
   * Whether to include the response in the audit log
   * @default false
   */
  includeResponse?: boolean;
}

export const AUDITABLE_KEY = 'auditable';

/**
 * Decorator to mark a controller method as auditable.
 * When applied, the method execution will be logged to the audit trail.
 *
 * @param options - Configuration options for the audit log
 *
 * @example
 * ```typescript
 * @Put(':id')
 * @Auditable({ action: AuditAction.UPDATE, entityType: 'User' })
 * async update(@Param('id') id: number, @Body() dto: UpdateUserDto) {
 *   return this.usersService.update(id, dto);
 * }
 * ```
 */
export const Auditable = (options: AuditableOptions): MethodDecorator =>
  SetMetadata(AUDITABLE_KEY, {
    idParam: 'id',
    includeBody: true,
    includeResponse: false,
    ...options,
  });

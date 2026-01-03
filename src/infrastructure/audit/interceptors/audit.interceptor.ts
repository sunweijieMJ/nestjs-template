import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { AuditService } from '../audit.service';
import { AUDITABLE_KEY, AuditableOptions } from '../decorators/auditable.decorator';

interface RequestWithUser extends Request {
  user?: { id?: string | number };
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const auditOptions = this.reflector.get<AuditableOptions>(AUDITABLE_KEY, context.getHandler());

    if (!auditOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const { action, entityType, idParam, includeBody, includeResponse } = auditOptions;

    const entityId = request.params[idParam ?? 'id'] ?? 'unknown';
    const userId = request.user?.id ?? null;
    const requestBody = includeBody ? { ...request.body } : null;

    return next.handle().pipe(
      tap({
        next: (response) => {
          this.auditService
            .log({
              userId,
              action,
              entityType,
              entityId,
              oldValue: null, // For full old value, you'd need to fetch before update
              newValue: includeResponse ? (response as Record<string, unknown>) : requestBody,
              request,
            })
            .catch((error) => {
              this.logger.error('Failed to create audit log', error);
            });
        },
        error: (error) => {
          // Optionally log failed operations
          this.logger.debug(`Operation failed for ${action} on ${entityType}:${entityId}`, {
            error: error?.message,
          });
        },
      }),
    );
  }
}

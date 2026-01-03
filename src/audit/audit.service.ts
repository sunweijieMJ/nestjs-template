import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import {
  AuditLogRepository,
  FindAuditLogsOptions,
} from './infrastructure/persistence/audit-log.repository';
import { AuditLog, AuditAction } from './domain/audit-log';
import { IPaginationOptions } from '../utils/types/pagination-options';

export interface CreateAuditLogParams {
  userId?: string | number | null;
  action: AuditAction;
  entityType: string;
  entityId: string | number;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  request?: Request;
}

/**
 * Sensitive fields that should be redacted from audit logs
 */
const SENSITIVE_FIELDS = [
  'password',
  'oldPassword',
  'newPassword',
  'token',
  'refreshToken',
  'secret',
  'apiKey',
  'accessToken',
];

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  /**
   * Create a new audit log entry
   */
  async log(params: CreateAuditLogParams): Promise<AuditLog> {
    const { userId, action, entityType, entityId, oldValue, newValue, request } = params;

    const auditLog = await this.auditLogRepository.create({
      userId: userId ?? null,
      action,
      entityType,
      entityId,
      oldValue: this.sanitize(oldValue),
      newValue: this.sanitize(newValue),
      ipAddress: this.getClientIp(request),
      userAgent: request?.headers?.['user-agent'] ?? null,
      requestId: (request?.headers?.['x-request-id'] as string) ?? null,
    });

    this.logger.debug(
      `Audit log created: ${action} on ${entityType}:${entityId} by user ${userId ?? 'anonymous'}`,
    );

    return auditLog;
  }

  /**
   * Find audit logs with pagination and filters
   */
  async findMany(options: {
    filterOptions?: FindAuditLogsOptions;
    paginationOptions: IPaginationOptions;
  }): Promise<AuditLog[]> {
    return this.auditLogRepository.findManyWithPagination(options);
  }

  /**
   * Find audit log by ID
   */
  async findById(id: number): Promise<AuditLog | null> {
    return this.auditLogRepository.findById(id);
  }

  /**
   * Find all audit logs for a specific entity
   */
  async findByEntity(entityType: string, entityId: string | number): Promise<AuditLog[]> {
    return this.auditLogRepository.findByEntityId(entityType, entityId);
  }

  /**
   * Find all audit logs for a specific user
   */
  async findByUser(userId: string | number): Promise<AuditLog[]> {
    return this.auditLogRepository.findByUserId(userId);
  }

  /**
   * Remove sensitive fields from the audit data
   * Includes protection against circular references and deep nesting
   */
  private sanitize(
    value: Record<string, unknown> | null | undefined,
    visited = new WeakSet<object>(),
    depth = 0,
  ): Record<string, unknown> | null {
    // Max recursion depth to prevent stack overflow
    const MAX_DEPTH = 10;

    if (!value) return null;
    if (depth > MAX_DEPTH) return { __truncated: true };

    // Circular reference detection
    if (visited.has(value)) {
      return { __circular: true };
    }
    visited.add(value);

    const sanitized: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(value)) {
      if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        sanitized[key] = this.sanitize(val as Record<string, unknown>, visited, depth + 1);
      } else if (Array.isArray(val)) {
        sanitized[key] = val.map((item) =>
          typeof item === 'object' && item !== null
            ? this.sanitize(item as Record<string, unknown>, visited, depth + 1)
            : item,
        );
      } else {
        sanitized[key] = val;
      }
    }

    return sanitized;
  }

  /**
   * Extract client IP from request
   */
  private getClientIp(request?: Request): string | null {
    if (!request) return null;

    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return ips.split(',')[0].trim();
    }

    return request.ip ?? null;
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AuditLogEntity } from '../entities/audit-log.entity';
import { AuditLogMapper } from '../mappers/audit-log.mapper';
import { AuditLog } from '../../../../domain/audit-log';
import { AuditLogRepository, FindAuditLogsOptions } from '../../audit-log.repository';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class AuditLogRelationalRepository implements AuditLogRepository {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
  ) {}

  async create(data: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    const entity = this.auditLogRepository.create(AuditLogMapper.toPersistence(data));
    const saved = await this.auditLogRepository.save(entity);
    return AuditLogMapper.toDomain(saved);
  }

  async findManyWithPagination(options: {
    filterOptions?: FindAuditLogsOptions;
    paginationOptions: IPaginationOptions;
  }): Promise<AuditLog[]> {
    const { filterOptions, paginationOptions } = options;
    const where: Record<string, unknown> = {};

    if (filterOptions?.userId) {
      where.userId = filterOptions.userId.toString();
    }
    if (filterOptions?.entityType) {
      where.entityType = filterOptions.entityType;
    }
    if (filterOptions?.entityId) {
      where.entityId = filterOptions.entityId.toString();
    }
    if (filterOptions?.action) {
      where.action = filterOptions.action;
    }
    if (filterOptions?.startDate && filterOptions?.endDate) {
      where.createdAt = Between(filterOptions.startDate, filterOptions.endDate);
    } else if (filterOptions?.startDate) {
      where.createdAt = MoreThanOrEqual(filterOptions.startDate);
    } else if (filterOptions?.endDate) {
      where.createdAt = LessThanOrEqual(filterOptions.endDate);
    }

    const entities = await this.auditLogRepository.find({
      where,
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      order: { createdAt: 'DESC' },
    });

    return entities.map(AuditLogMapper.toDomain);
  }

  async findById(id: number): Promise<AuditLog | null> {
    const entity = await this.auditLogRepository.findOne({
      where: { id },
    });
    return entity ? AuditLogMapper.toDomain(entity) : null;
  }

  async findByEntityId(entityType: string, entityId: string | number): Promise<AuditLog[]> {
    const entities = await this.auditLogRepository.find({
      where: {
        entityType,
        entityId: entityId.toString(),
      },
      order: { createdAt: 'DESC' },
    });
    return entities.map(AuditLogMapper.toDomain);
  }

  async findByUserId(userId: string | number): Promise<AuditLog[]> {
    const entities = await this.auditLogRepository.find({
      where: { userId: userId.toString() },
      order: { createdAt: 'DESC' },
    });
    return entities.map(AuditLogMapper.toDomain);
  }
}

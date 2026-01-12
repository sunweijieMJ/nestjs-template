import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShareLogEntity } from '../entities/share-log.entity';
import { ShareLogRepository } from '../../share-log.repository';
import { ShareLogMapper } from '../mappers/share-log.mapper';
import { ShareLog } from '../../../../domain/share-log';

@Injectable()
export class ShareLogRelationalRepository implements ShareLogRepository {
  constructor(
    @InjectRepository(ShareLogEntity)
    private readonly shareLogRepository: Repository<ShareLogEntity>,
  ) {}

  async create(data: Omit<ShareLog, 'id' | 'createdAt'>): Promise<ShareLog> {
    const persistenceModel = ShareLogMapper.toPersistence(data);
    const newEntity = await this.shareLogRepository.save(this.shareLogRepository.create(persistenceModel));
    return ShareLogMapper.toDomain(newEntity);
  }

  async findByShareId(shareId: ShareLog['shareId']): Promise<ShareLog[]> {
    const entities = await this.shareLogRepository.find({
      where: { shareId: Number(shareId) },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => ShareLogMapper.toDomain(entity));
  }
}

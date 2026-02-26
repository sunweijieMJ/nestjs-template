import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigEntity } from '../entities/config.entity';
import { ConfigMapper } from '../mappers/config.mapper';
import { AppConfigRepository } from '../../config.repository';
import { Config } from '../../../../domain/config';
import { NullableType } from '../../../../../../common/types/nullable.type';

@Injectable()
export class ConfigRelationalRepository implements AppConfigRepository {
  constructor(
    @InjectRepository(ConfigEntity)
    private readonly repo: Repository<ConfigEntity>,
  ) {}

  async findByKey(key: string): Promise<NullableType<Config>> {
    const entity = await this.repo.findOne({ where: { key } });
    return entity ? ConfigMapper.toDomain(entity) : null;
  }

  async upsert(key: string, value: Record<string, unknown>): Promise<Config> {
    let entity = await this.repo.findOne({ where: { key } });
    if (entity) {
      entity.value = value;
    } else {
      entity = this.repo.create({ key, value });
    }
    const saved = await this.repo.save(entity);
    return ConfigMapper.toDomain(saved);
  }
}

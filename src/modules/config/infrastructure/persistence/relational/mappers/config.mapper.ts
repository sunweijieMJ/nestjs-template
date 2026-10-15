import { Config } from '../../../../domain/config';
import { ConfigEntity } from '../entities/config.entity';

export class ConfigMapper {
  static toDomain(entity: ConfigEntity): Config {
    const domain = new Config();
    domain.key = entity.key;
    domain.value = entity.value;
    domain.isPublic = entity.isPublic;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    return domain;
  }

  static toPersistence(domain: { key: string; value: Record<string, unknown>; isPublic: boolean }): ConfigEntity {
    const entity = new ConfigEntity();
    entity.key = domain.key;
    entity.value = domain.value;
    entity.isPublic = domain.isPublic;
    return entity;
  }
}

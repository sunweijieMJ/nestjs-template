import { Region } from '../../../../domain/region';
import { RegionEntity } from '../entities/region.entity';

export class RegionMapper {
  static toDomain(entity: RegionEntity): Region {
    const domain = new Region();
    domain.id = entity.id;
    domain.code = entity.code;
    domain.name = entity.name;
    domain.level = entity.level;
    domain.parentCode = entity.parentCode;
    domain.sort = entity.sort;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    return domain;
  }

  static toPersistence(domain: Region): RegionEntity {
    const entity = new RegionEntity();
    if (domain.id) {
      entity.id = domain.id;
    }
    entity.code = domain.code;
    entity.name = domain.name;
    entity.level = domain.level;
    entity.parentCode = domain.parentCode;
    entity.sort = domain.sort;
    return entity;
  }
}

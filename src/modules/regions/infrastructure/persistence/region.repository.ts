import { NullableType } from '../../../../common/types/nullable.type';
import { Region } from '../../domain/region';

export abstract class RegionRepository {
  abstract findByCode(code: string): Promise<NullableType<Region>>;

  abstract findByLevel(level: number): Promise<Region[]>;

  abstract findByParentCode(parentCode: string | null): Promise<Region[]>;

  abstract findAll(): Promise<Region[]>;

  abstract searchByName(keyword: string, limit?: number): Promise<Region[]>;
}

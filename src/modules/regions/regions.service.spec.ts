import type { Mocked } from 'vitest';
import { Cache } from 'cache-manager';
import { RegionsService } from './regions.service';
import { RegionRepository } from './infrastructure/persistence/region.repository';
import { Region } from './domain/region';

describe('RegionsService', () => {
  let repository: Mocked<Pick<RegionRepository, 'findByCode' | 'findByParentCode'>>;
  let cache: Map<string, unknown>;
  let service: RegionsService;

  beforeEach(() => {
    repository = { findByCode: vi.fn(), findByParentCode: vi.fn() };
    cache = new Map();
    const cacheManager = {
      get: async (key: string) => cache.get(key),
      set: async (key: string, value: unknown) => cache.set(key, value),
    } as unknown as Cache;
    service = new RegionsService(repository as unknown as RegionRepository, cacheManager);
  });

  it('should remember a missing code only in the short miss cache', async () => {
    repository.findByCode.mockResolvedValue(null);

    await expect(service.getByCode('110000000000')).resolves.toBeNull();
    await expect(service.getByCode('110000000000')).resolves.toBeNull();

    expect(repository.findByCode).toHaveBeenCalledTimes(1);
    expect(cache.get('region:code:110000000000')).toBeUndefined();
    expect(cache.get('region:code-miss:110000000000')).toBe(true);
  });

  it('should cache a found region', async () => {
    repository.findByCode.mockResolvedValue({ code: '110000000000' } as Region);

    await service.getByCode('110000000000');
    await service.getByCode('110000000000');

    expect(repository.findByCode).toHaveBeenCalledTimes(1);
  });

  it('should ignore an empty city list left in the cache', async () => {
    cache.set('region:cities:110000000000', []);
    repository.findByParentCode.mockResolvedValue([{ code: '110100000000' } as Region]);

    await expect(service.getCitiesByProvinceCode('110000000000')).resolves.toHaveLength(1);
  });

  it('should not cache an empty city list', async () => {
    repository.findByParentCode.mockResolvedValue([]);

    await service.getCitiesByProvinceCode('110000000000');
    await service.getCitiesByProvinceCode('110000000000');

    expect(repository.findByParentCode).toHaveBeenCalledTimes(2);
  });
});

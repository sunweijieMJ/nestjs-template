import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RegionRepository } from './infrastructure/persistence/region.repository';
import { Region } from './domain/region';
import { QueryRegionDto } from './dto/query-region.dto';

export interface RegionTree extends Region {
  children?: RegionTree[];
}

const CACHE_KEY_PREFIX = 'region:';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

@Injectable()
export class RegionsService {
  private readonly logger = new Logger(RegionsService.name);

  constructor(
    private readonly regionRepository: RegionRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Get all provinces (level 1)
   */
  async getProvinces(): Promise<Region[]> {
    const cacheKey = `${CACHE_KEY_PREFIX}provinces`;
    const cached = await this.cacheManager.get<Region[]>(cacheKey);
    if (cached) {
      this.logger.debug('Returning cached provinces');
      return cached;
    }

    this.logger.log('Fetching all provinces from database');
    const provinces = await this.regionRepository.findByLevel(1);
    await this.cacheManager.set(cacheKey, provinces, CACHE_TTL);
    return provinces;
  }

  /**
   * Get cities by province code
   */
  async getCitiesByProvinceCode(provinceCode: string): Promise<Region[]> {
    const cacheKey = `${CACHE_KEY_PREFIX}cities:${provinceCode}`;
    const cached = await this.cacheManager.get<Region[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Returning cached cities for province: ${provinceCode}`);
      return cached;
    }

    this.logger.log(`Fetching cities for province: ${provinceCode} from database`);
    const cities = await this.regionRepository.findByParentCode(provinceCode);
    await this.cacheManager.set(cacheKey, cities, CACHE_TTL);
    return cities;
  }

  /**
   * Get districts by city code
   */
  async getDistrictsByCityCode(cityCode: string): Promise<Region[]> {
    const cacheKey = `${CACHE_KEY_PREFIX}districts:${cityCode}`;
    const cached = await this.cacheManager.get<Region[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Returning cached districts for city: ${cityCode}`);
      return cached;
    }

    this.logger.log(`Fetching districts for city: ${cityCode} from database`);
    const districts = await this.regionRepository.findByParentCode(cityCode);
    await this.cacheManager.set(cacheKey, districts, CACHE_TTL);
    return districts;
  }

  /**
   * Get regions by query parameters
   */
  async query(queryDto: QueryRegionDto): Promise<Region[]> {
    if (queryDto.keyword) {
      this.logger.log(`Searching regions by keyword: ${queryDto.keyword}`);
      return this.regionRepository.searchByName(queryDto.keyword);
    }

    if (queryDto.parentCode !== undefined) {
      this.logger.log(`Fetching regions by parent code: ${queryDto.parentCode}`);
      return this.regionRepository.findByParentCode(queryDto.parentCode);
    }

    if (queryDto.level) {
      this.logger.log(`Fetching regions by level: ${queryDto.level}`);
      return this.regionRepository.findByLevel(queryDto.level);
    }

    this.logger.log('Fetching all regions');
    return this.regionRepository.findAll();
  }

  /**
   * Get full region tree (province -> city -> district)
   */
  async getTree(): Promise<RegionTree[]> {
    const cacheKey = `${CACHE_KEY_PREFIX}tree`;
    const cached = await this.cacheManager.get<RegionTree[]>(cacheKey);
    if (cached) {
      this.logger.debug('Returning cached region tree');
      return cached;
    }

    this.logger.log('Building region tree from database');
    const allRegions = await this.regionRepository.findAll();

    const regionMap = new Map<string, RegionTree>();
    allRegions.forEach((region) => {
      regionMap.set(region.code, { ...region, children: [] });
    });

    const tree: RegionTree[] = [];
    allRegions.forEach((region) => {
      const node = regionMap.get(region.code)!;
      if (region.parentCode === null) {
        tree.push(node);
      } else {
        const parent = regionMap.get(region.parentCode);
        if (parent) {
          parent.children!.push(node);
        }
      }
    });

    await this.cacheManager.set(cacheKey, tree, CACHE_TTL);
    return tree;
  }

  /**
   * Get region by code
   */
  async getByCode(code: string): Promise<Region | null> {
    const cacheKey = `${CACHE_KEY_PREFIX}code:${code}`;
    const cached = await this.cacheManager.get<Region | null>(cacheKey);
    if (cached !== undefined) {
      this.logger.debug(`Returning cached region for code: ${code}`);
      return cached;
    }

    this.logger.log(`Fetching region by code: ${code} from database`);
    const region = await this.regionRepository.findByCode(code);
    await this.cacheManager.set(cacheKey, region, CACHE_TTL);
    return region;
  }

  /**
   * Validate province/city/district combination
   * Returns region objects if valid to avoid duplicate queries
   */
  async validateRegionCombination(
    provinceCode: string,
    cityCode: string,
    districtCode: string,
  ): Promise<{ valid: false } | { valid: true; regions: [Region, Region, Region] }> {
    // Use cached getByCode instead of direct repository access
    const [province, city, district] = await Promise.all([
      this.getByCode(provinceCode),
      this.getByCode(cityCode),
      this.getByCode(districtCode),
    ]);

    if (!province || !city || !district) {
      return { valid: false };
    }

    if (province.level !== 1 || city.level !== 2 || district.level !== 3) {
      return { valid: false };
    }

    if (city.parentCode !== provinceCode || district.parentCode !== cityCode) {
      return { valid: false };
    }

    return { valid: true, regions: [province, city, district] };
  }
}

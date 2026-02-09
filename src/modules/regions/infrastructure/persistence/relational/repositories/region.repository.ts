import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, IsNull, Repository } from 'typeorm';
import { RegionEntity } from '../entities/region.entity';
import { RegionRepository } from '../../region.repository';
import { RegionMapper } from '../mappers/region.mapper';
import { Region } from '../../../../domain/region';
import { NullableType } from '../../../../../../common/types/nullable.type';

@Injectable()
export class RegionRelationalRepository implements RegionRepository {
  constructor(
    @InjectRepository(RegionEntity)
    private readonly regionRepository: Repository<RegionEntity>,
  ) {}

  async findByCode(code: string): Promise<NullableType<Region>> {
    const entity = await this.regionRepository.findOne({
      where: { code },
    });
    return entity ? RegionMapper.toDomain(entity) : null;
  }

  async findByLevel(level: number): Promise<Region[]> {
    const entities = await this.regionRepository.find({
      where: { level },
      order: { sort: 'ASC', code: 'ASC' },
    });
    return entities.map((entity) => RegionMapper.toDomain(entity));
  }

  async findByParentCode(parentCode: string | null): Promise<Region[]> {
    const entities = await this.regionRepository.find({
      where: { parentCode: parentCode ?? IsNull() },
      order: { sort: 'ASC', code: 'ASC' },
    });
    return entities.map((entity) => RegionMapper.toDomain(entity));
  }

  async findAll(): Promise<Region[]> {
    const entities = await this.regionRepository.find({
      order: { level: 'ASC', sort: 'ASC', code: 'ASC' },
    });
    return entities.map((entity) => RegionMapper.toDomain(entity));
  }

  async searchByName(keyword: string, limit = 20): Promise<Region[]> {
    // Escape special characters % and _ for LIKE query
    const escapedKeyword = keyword.replace(/[%_]/g, '\\$&');

    const entities = await this.regionRepository.find({
      where: { name: ILike(`%${escapedKeyword}%`) },
      order: { level: 'ASC', sort: 'ASC' },
      take: limit,
    });
    return entities.map((entity) => RegionMapper.toDomain(entity));
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegionEntity } from '../../../../../modules/regions/infrastructure/persistence/relational/entities/region.entity';
import * as fs from 'fs';
import * as path from 'path';

interface RegionData {
  code: string;
  name: string;
  children?: RegionData[];
}

@Injectable()
export class RegionSeedService {
  constructor(
    @InjectRepository(RegionEntity)
    private repository: Repository<RegionEntity>,
  ) {}

  async run() {
    const count = await this.repository.count();
    if (count > 0) {
      console.log('Region data already exists, skipping seed');
      return;
    }

    console.log('Starting region data seeding...');

    const dataPath = path.join(__dirname, 'region-data.json');

    // Check if data file exists
    if (!fs.existsSync(dataPath)) {
      console.error(`Region data file not found: ${dataPath}`);
      throw new Error('Region seed data file not found');
    }

    // Parse JSON with error handling
    let rawData: RegionData[];
    try {
      rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    } catch (error) {
      console.error('Failed to parse region data:', error);
      throw new Error('Invalid region seed data format');
    }

    // Validate data structure
    if (!Array.isArray(rawData) || rawData.length === 0) {
      console.error('Region data is empty or invalid');
      throw new Error('Region seed data is empty');
    }

    const regions: Partial<RegionEntity>[] = [];
    let sortIndex = 0;

    // Process provinces (level 1)
    for (const province of rawData) {
      const provinceCode = this.normalizeCode(province.code, 1);
      regions.push({
        code: provinceCode,
        name: province.name,
        level: 1,
        parentCode: null,
        sort: sortIndex++,
      });

      // Process cities (level 2)
      if (province.children) {
        for (const city of province.children) {
          const cityCode = this.normalizeCode(city.code, 2);
          regions.push({
            code: cityCode,
            name: city.name,
            level: 2,
            parentCode: provinceCode,
            sort: sortIndex++,
          });

          // Process districts (level 3)
          if (city.children) {
            for (const district of city.children) {
              const districtCode = this.normalizeCode(district.code, 3);
              regions.push({
                code: districtCode,
                name: district.name,
                level: 3,
                parentCode: cityCode,
                sort: sortIndex++,
              });
            }
          }
        }
      }
    }

    console.log(`Seeding ${regions.length} regions...`);

    // Insert in batches to avoid memory issues
    const batchSize = 500;
    for (let i = 0; i < regions.length; i += batchSize) {
      const batch = regions.slice(i, i + batchSize);
      await this.repository.save(batch);
      console.log(`Inserted batch ${i / batchSize + 1} (${batch.length} records)`);
    }

    console.log('Region data seeding completed!');
  }

  /**
   * Normalize code to 12 digits
   * Province: 2 digits -> 110000000000
   * City: 4 digits -> 110100000000
   * District: 6 digits -> 110101000000
   */
  private normalizeCode(code: string, level: number): string {
    const codeLength = code.length;

    if (level === 1 && codeLength === 2) {
      return code + '0000000000';
    } else if (level === 2 && codeLength === 4) {
      return code + '00000000';
    } else if (level === 3 && codeLength === 6) {
      return code + '000000';
    }

    // If already 12 digits or other format, return as is
    return code.padEnd(12, '0');
  }
}

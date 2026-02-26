import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AppConfigRepository } from './infrastructure/persistence/config.repository';
import { Config } from './domain/config';

@Injectable()
export class AppConfigService {
  private readonly logger = new Logger(AppConfigService.name);

  constructor(private readonly configRepository: AppConfigRepository) {}

  async findByKey(key: string): Promise<Config> {
    const config = await this.configRepository.findByKey(key);
    if (!config) {
      throw new NotFoundException({ error: 'configNotFound' });
    }
    return config;
  }

  async upsert(key: string, value: Record<string, unknown>): Promise<Config> {
    this.logger.log(`Upsert config: ${key}`);
    return this.configRepository.upsert(key, value);
  }
}

import type { Mocked } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { AppConfigService } from './config.service';
import { AppConfigRepository } from './infrastructure/persistence/config.repository';
import { Config } from './domain/config';

function buildConfig(overrides: Partial<Config> = {}): Config {
  return {
    key: 'app.theme',
    value: { primaryColor: '#1890ff' },
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('AppConfigService', () => {
  let repository: Mocked<AppConfigRepository>;
  let service: AppConfigService;

  beforeEach(() => {
    repository = { findByKey: vi.fn(), upsert: vi.fn() };
    service = new AppConfigService(repository);
  });

  describe('findPublicByKey', () => {
    it('should return a public config', async () => {
      repository.findByKey.mockResolvedValue(buildConfig());
      await expect(service.findPublicByKey('app.theme')).resolves.toMatchObject({ key: 'app.theme' });
    });

    it('should throw 404 for a private config', async () => {
      repository.findByKey.mockResolvedValue(buildConfig({ isPublic: false }));
      await expect(service.findPublicByKey('app.theme')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw 404 when the config does not exist', async () => {
      repository.findByKey.mockResolvedValue(null);
      await expect(service.findPublicByKey('app.theme')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findByKey', () => {
    it('should return a private config', async () => {
      repository.findByKey.mockResolvedValue(buildConfig({ isPublic: false }));
      await expect(service.findByKey('app.theme')).resolves.toMatchObject({ isPublic: false });
    });
  });
});

import type { Mocked } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { AddressRepository } from './infrastructure/persistence/address.repository';
import { RegionsService } from '../regions/regions.service';
import { Address } from './domain/address';

function buildAddress(overrides: Partial<Address> = {}): Address {
  return {
    id: 1,
    userId: 10,
    name: 'A',
    phone: '13800000000',
    provinceCode: null,
    cityCode: null,
    districtCode: null,
    province: 'P',
    city: 'C',
    district: 'D',
    address: 'street',
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Address;
}

describe('AddressesService', () => {
  let repository: Mocked<
    Pick<
      AddressRepository,
      'createWithinLimit' | 'markDefault' | 'findByIdAndUserId' | 'update' | 'remove' | 'findManyWithPagination'
    >
  >;
  let service: AddressesService;

  const dto = { name: 'A', phone: '13800000000', province: 'P', city: 'C', district: 'D', address: 'street' };

  beforeEach(() => {
    repository = {
      createWithinLimit: vi.fn(),
      markDefault: vi.fn(),
      findByIdAndUserId: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      findManyWithPagination: vi.fn(),
    };
    service = new AddressesService(repository as unknown as AddressRepository, {} as RegionsService);
  });

  describe('create', () => {
    it('should throw 403 when the user has reached the address limit', async () => {
      repository.createWithinLimit.mockResolvedValue(null);

      await expect(service.create(10, dto)).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.createWithinLimit).toHaveBeenCalledWith(expect.objectContaining({ isDefault: false }), 20);
    });

    it('should make the first address the default', async () => {
      repository.createWithinLimit.mockResolvedValue({ address: buildAddress({ id: 5 }), previousCount: 0 });

      await expect(service.create(10, dto)).resolves.toMatchObject({ id: 5, isDefault: true });
      expect(repository.markDefault).toHaveBeenCalledWith(5, 10);
    });

    it('should make a later address the default when requested', async () => {
      repository.createWithinLimit.mockResolvedValue({ address: buildAddress({ id: 6 }), previousCount: 3 });

      await expect(service.create(10, { ...dto, isDefault: true })).resolves.toMatchObject({ id: 6, isDefault: true });
      expect(repository.markDefault).toHaveBeenCalledWith(6, 10);
    });

    it('should not make a later address the default unless requested', async () => {
      repository.createWithinLimit.mockResolvedValue({ address: buildAddress({ id: 5 }), previousCount: 3 });

      await expect(service.create(10, dto)).resolves.toMatchObject({ isDefault: false });
      expect(repository.markDefault).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    beforeEach(() => {
      repository.findByIdAndUserId.mockResolvedValue(buildAddress());
      repository.update.mockResolvedValue(buildAddress());
    });

    it('should set the default through markDefault instead of writing the flag directly', async () => {
      await expect(service.update(1, 10, { name: 'B', isDefault: true })).resolves.toMatchObject({ isDefault: true });

      expect(repository.update).toHaveBeenCalledWith(1, { name: 'B' });
      expect(repository.markDefault).toHaveBeenCalledWith(1, 10);
    });

    it('should clear the default flag directly', async () => {
      await service.update(1, 10, { isDefault: false });

      expect(repository.update).toHaveBeenCalledWith(1, { isDefault: false });
      expect(repository.markDefault).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should make the next address the default after removing the default address', async () => {
      repository.findByIdAndUserId.mockResolvedValue(buildAddress({ isDefault: true }));
      repository.findManyWithPagination.mockResolvedValue([buildAddress({ id: 2 })]);

      await service.remove(1, 10);

      expect(repository.remove).toHaveBeenCalledWith(1);
      expect(repository.markDefault).toHaveBeenCalledWith(2, 10);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });
});

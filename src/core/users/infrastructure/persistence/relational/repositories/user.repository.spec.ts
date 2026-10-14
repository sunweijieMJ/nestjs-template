import type { Mocked } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { IsNull, Repository } from 'typeorm';
import { UsersRelationalRepository } from './user.repository';
import { UserEntity } from '../entities/user.entity';

describe('UsersRelationalRepository', () => {
  describe('update', () => {
    let typeormRepository: Mocked<Pick<Repository<UserEntity>, 'update' | 'findOne'>>;
    let repository: UsersRelationalRepository;

    beforeEach(() => {
      typeormRepository = {
        update: vi.fn().mockResolvedValue({ affected: 1 }),
        findOne: vi.fn().mockResolvedValue({ id: 1, email: 'a@b.c' }),
      };
      repository = new UsersRelationalRepository(typeormRepository as unknown as Repository<UserEntity>);
    });

    it('should write only the provided fields of a live user', async () => {
      await repository.update(1, {
        firstName: 'A',
        lastName: undefined,
        role: { id: 2 },
        photo: null,
      });

      expect(typeormRepository.update).toHaveBeenCalledWith(
        { id: 1, deletedAt: IsNull() },
        { firstName: 'A', role: { id: 2 }, photo: null },
      );
    });

    it('should throw 404 when the user does not exist or was deleted', async () => {
      typeormRepository.update.mockResolvedValue({ affected: 0, raw: [], generatedMaps: [] });

      await expect(repository.update(1, { firstName: 'A' })).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('bind identity', () => {
    let typeormRepository: Mocked<Pick<Repository<UserEntity>, 'update'>>;
    let repository: UsersRelationalRepository;

    beforeEach(() => {
      typeormRepository = { update: vi.fn().mockResolvedValue({ affected: 1 }) };
      repository = new UsersRelationalRepository(typeormRepository as unknown as Repository<UserEntity>);
    });

    it('should bind the phone only when the live user has no phone', async () => {
      await expect(repository.bindPhoneIfEmpty(1, '13800000000')).resolves.toBe(true);

      expect(typeormRepository.update).toHaveBeenCalledWith(
        { id: 1, phone: IsNull(), deletedAt: IsNull() },
        { phone: '13800000000' },
      );
    });

    it('should bind the openId and unionId only when the live user has no openId', async () => {
      await expect(repository.bindWechatIfEmpty(1, 'OPEN1', 'UNION1')).resolves.toBe(true);

      expect(typeormRepository.update).toHaveBeenCalledWith(
        { id: 1, wechatOpenId: IsNull(), deletedAt: IsNull() },
        { wechatOpenId: 'OPEN1', wechatUnionId: 'UNION1' },
      );
    });

    it('should return false when the field is already bound', async () => {
      typeormRepository.update.mockResolvedValue({ affected: 0, raw: [], generatedMaps: [] });

      await expect(repository.bindPhoneIfEmpty(1, '13800000000')).resolves.toBe(false);
    });
  });
});

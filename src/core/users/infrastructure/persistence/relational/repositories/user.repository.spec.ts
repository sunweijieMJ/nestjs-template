import { NotFoundException } from '@nestjs/common';
import { IsNull, Repository } from 'typeorm';
import { UsersRelationalRepository } from './user.repository';
import { UserEntity } from '../entities/user.entity';

describe('UsersRelationalRepository', () => {
  describe('update', () => {
    let typeormRepository: jest.Mocked<Pick<Repository<UserEntity>, 'update' | 'findOne'>>;
    let repository: UsersRelationalRepository;

    beforeEach(() => {
      typeormRepository = {
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        findOne: jest.fn().mockResolvedValue({ id: 1, email: 'a@b.c' }),
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
});

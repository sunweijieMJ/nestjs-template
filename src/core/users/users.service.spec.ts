import type { Mocked } from 'vitest';
import { UsersService } from './users.service';
import { UserRepository } from './infrastructure/persistence/user.repository';
import { FilesService } from '../../modules/files/files.service';
import { SessionService } from '../session/session.service';

describe('UsersService', () => {
  describe('updateByAdmin', () => {
    let repository: Mocked<Pick<UserRepository, 'findById' | 'update'>>;
    let sessionService: Mocked<Pick<SessionService, 'deleteByUserId'>>;
    let service: UsersService;

    beforeEach(() => {
      repository = {
        findById: vi.fn().mockResolvedValue({ id: 1, password: 'hash' }),
        update: vi.fn().mockResolvedValue({ id: 1 }),
      };
      sessionService = { deleteByUserId: vi.fn() };
      service = new UsersService(
        repository as unknown as UserRepository,
        {} as FilesService,
        sessionService as unknown as SessionService,
      );
    });

    it('should revoke every session of the user after changing the password', async () => {
      await service.updateByAdmin(1, { password: 'e10adc3949ba59abbe56e057f20f883e' });

      expect(sessionService.deleteByUserId).toHaveBeenCalledWith({ userId: 1 });
    });

    it('should keep the sessions when the password is not changed', async () => {
      await service.updateByAdmin(1, { firstName: 'A' });

      expect(sessionService.deleteByUserId).not.toHaveBeenCalled();
    });
  });
});

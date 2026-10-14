import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CredentialRepository } from '../../credential.repository';
import { User } from '../../../../../users/domain/user';
import { Session } from '../../../../../session/domain/session';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { SessionEntity } from '../../../../../session/infrastructure/persistence/relational/entities/session.entity';

@Injectable()
export class CredentialRelationalRepository implements CredentialRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async resetPassword(
    userId: User['id'],
    hashedPassword: string,
    expectedCurrentPassword?: string | null,
  ): Promise<{ updated: boolean; revokedSessionIds: Session['id'][] }> {
    return this.dataSource.transaction(async (manager) => {
      const update = manager
        .createQueryBuilder()
        .update(UserEntity)
        .set({ password: hashedPassword })
        .where('id = :id', { id: Number(userId) });
      if (expectedCurrentPassword !== undefined) {
        update.andWhere('password IS NOT DISTINCT FROM :expected', { expected: expectedCurrentPassword });
      }
      const result = await update.execute();
      if (!result.affected) {
        return { updated: false, revokedSessionIds: [] };
      }

      const sessions = await manager.find(SessionEntity, {
        select: { id: true },
        where: { user: { id: Number(userId) } },
      });
      await manager.softDelete(SessionEntity, { user: { id: Number(userId) } });
      return { updated: true, revokedSessionIds: sessions.map((session) => session.id) };
    });
  }
}

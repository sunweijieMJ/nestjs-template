import { User } from '../../../users/domain/user';
import { Session } from '../../../session/domain/session';

export abstract class CredentialRepository {
  /**
   * 在同一事务中更新密码并吊销该用户的全部会话；传入 expectedCurrentPassword 时，
   * 仅当库中密码仍等于该值才更新，否则不做任何修改并返回 updated: false
   */
  abstract resetPassword(
    userId: User['id'],
    hashedPassword: string,
    expectedCurrentPassword?: string | null,
  ): Promise<{ updated: boolean; revokedSessionIds: Session['id'][] }>;
}

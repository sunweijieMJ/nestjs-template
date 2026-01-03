import { Injectable, Logger } from '@nestjs/common';

import { SessionRepository } from './infrastructure/persistence/session.repository';
import { Session } from './domain/session';
import { User } from '../users/domain/user';
import { NullableType } from '../utils/types/nullable.type';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(private readonly sessionRepository: SessionRepository) {}

  findById(id: Session['id']): Promise<NullableType<Session>> {
    return this.sessionRepository.findById(id);
  }

  async create(data: Omit<Session, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Session> {
    const session = await this.sessionRepository.create(data);
    this.logger.debug(`Session created: ${session.id} for user: ${data.user.id}`);
    return session;
  }

  update(
    id: Session['id'],
    payload: Partial<Omit<Session, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>,
  ): Promise<Session | null> {
    this.logger.debug(`Session updated: ${id}`);
    return this.sessionRepository.update(id, payload);
  }

  async deleteById(id: Session['id']): Promise<void> {
    await this.sessionRepository.deleteById(id);
    this.logger.debug(`Session deleted: ${id}`);
  }

  async deleteByUserId(conditions: { userId: User['id'] }): Promise<void> {
    await this.sessionRepository.deleteByUserId(conditions);
    this.logger.debug(`All sessions deleted for user: ${conditions.userId}`);
  }

  async deleteByUserIdWithExclude(conditions: { userId: User['id']; excludeSessionId: Session['id'] }): Promise<void> {
    await this.sessionRepository.deleteByUserIdWithExclude(conditions);
    this.logger.debug(`Sessions deleted for user: ${conditions.userId}, excluding: ${conditions.excludeSessionId}`);
  }
}

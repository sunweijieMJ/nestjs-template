import { Injectable, Logger } from '@nestjs/common';

import { SessionRepository } from './infrastructure/persistence/session.repository';
import { Session } from './domain/session';
import { User } from '../users/domain/user';
import { NullableType } from '../../common/types/nullable.type';

/**
 * 会话服务 - 管理用户登录会话
 */
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(private readonly sessionRepository: SessionRepository) {}

  /**
   * 根据ID查找会话
   * @param id - 会话ID
   * @returns 会话对象或 null
   */
  findById(id: Session['id']): Promise<NullableType<Session>> {
    return this.sessionRepository.findById(id);
  }

  /**
   * 创建新会话
   * @param data - 会话数据（不包含ID和时间戳）
   * @returns 创建成功的会话对象
   */
  async create(data: Omit<Session, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Session> {
    const session = await this.sessionRepository.create(data);
    this.logger.debug(`Session created: ${session.id} for user: ${data.user.id}`);
    return session;
  }

  /**
   * 更新会话信息
   * @param id - 会话ID
   * @param payload - 更新的会话数据
   * @returns 更新后的会话对象或 null
   */
  update(
    id: Session['id'],
    payload: Partial<Omit<Session, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>,
  ): Promise<Session | null> {
    this.logger.debug(`Session updated: ${id}`);
    return this.sessionRepository.update(id, payload);
  }

  /**
   * 根据ID删除会话
   * @param id - 会话ID
   */
  async deleteById(id: Session['id']): Promise<void> {
    await this.sessionRepository.deleteById(id);
    this.logger.debug(`Session deleted: ${id}`);
  }

  /**
   * 删除用户的所有会话
   * @param conditions - 包含用户ID的条件对象
   */
  async deleteByUserId(conditions: { userId: User['id'] }): Promise<void> {
    await this.sessionRepository.deleteByUserId(conditions);
    this.logger.debug(`All sessions deleted for user: ${conditions.userId}`);
  }

  /**
   * 删除用户的所有会话（排除指定会话）
   * @param conditions - 包含用户ID和排除会话ID的条件对象
   */
  async deleteByUserIdWithExclude(conditions: { userId: User['id']; excludeSessionId: Session['id'] }): Promise<void> {
    await this.sessionRepository.deleteByUserIdWithExclude(conditions);
    this.logger.debug(`Sessions deleted for user: ${conditions.userId}, excluding: ${conditions.excludeSessionId}`);
  }
}

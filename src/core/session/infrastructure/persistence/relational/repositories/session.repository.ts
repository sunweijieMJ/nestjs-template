import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { SessionEntity } from '../entities/session.entity';
import { NullableType } from '../../../../../../common/types/nullable.type';

import { SessionRepository } from '../../session.repository';
import { Session } from '../../../../domain/session';

import { SessionMapper } from '../mappers/session.mapper';
import { User } from '../../../../../users/domain/user';

@Injectable()
export class SessionRelationalRepository implements SessionRepository {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
  ) {}

  async findById(id: Session['id']): Promise<NullableType<Session>> {
    const entity = await this.sessionRepository.findOne({
      where: {
        id: Number(id),
      },
      relations: { user: true },
    });

    return entity ? SessionMapper.toDomain(entity) : null;
  }

  async create(data: Session): Promise<Session> {
    const persistenceModel = SessionMapper.toPersistence(data);
    return this.sessionRepository.save(this.sessionRepository.create(persistenceModel));
  }

  async rotateHash(id: Session['id'], currentHash: string, nextHash: string): Promise<boolean> {
    const result = await this.sessionRepository.update(
      { id: Number(id), hash: currentHash, deletedAt: IsNull() },
      { hash: nextHash },
    );
    return (result.affected ?? 0) > 0;
  }

  async deleteById(id: Session['id']): Promise<void> {
    await this.sessionRepository.softDelete({
      id: Number(id),
    });
  }

  async deleteByUserId(conditions: { userId: User['id'] }): Promise<void> {
    await this.sessionRepository.softDelete({
      user: {
        id: Number(conditions.userId),
      },
    });
  }

  async deleteByUserIdWithExclude(conditions: { userId: User['id']; excludeSessionId: Session['id'] }): Promise<void> {
    await this.sessionRepository.softDelete({
      user: {
        id: Number(conditions.userId),
      },
      id: Not(Number(conditions.excludeSessionId)),
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { FindOptionsWhere, Repository, In } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { NullableType } from '../../../../../../common/types/nullable.type';
import { FilterUserDto, SortUserDto } from '../../../../dto/query-user.dto';
import { User } from '../../../../domain/user';
import { UserRepository } from '../../user.repository';
import { UserMapper } from '../mappers/user.mapper';
import { IPaginationOptions } from '../../../../../../common/types/pagination-options';
import { handleUniqueConstraintError } from '../../../../../../common/utils/exceptions.util';

@Injectable()
export class UsersRelationalRepository implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async create(data: User): Promise<User> {
    const persistenceModel = UserMapper.toPersistence(data);
    try {
      const newEntity = await this.usersRepository.save(this.usersRepository.create(persistenceModel));
      return UserMapper.toDomain(newEntity);
    } catch (error) {
      // 处理数据库唯一约束异常（竞态条件下的并发创建）
      handleUniqueConstraintError(error);
      throw error;
    }
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterUserDto | null;
    sortOptions?: SortUserDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<User[]> {
    const where: FindOptionsWhere<UserEntity> = {};
    if (filterOptions?.roles?.length) {
      where.role = filterOptions.roles.map((role) => ({
        id: Number(role.id),
      }));
    }

    const entities = await this.usersRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where: where,
      order: sortOptions?.reduce(
        (accumulator, sort) => ({
          ...accumulator,
          [sort.orderBy]: sort.order,
        }),
        {},
      ),
      relations: ['photo', 'role', 'status'],
    });

    return entities.map((user) => UserMapper.toDomain(user));
  }

  async findById(id: User['id']): Promise<NullableType<User>> {
    const entity = await this.usersRepository.findOne({
      where: { id: Number(id) },
      relations: ['photo', 'role', 'status'],
    });

    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByIds(ids: User['id'][]): Promise<User[]> {
    const entities = await this.usersRepository.find({
      where: { id: In(ids) },
      relations: ['photo', 'role', 'status'],
    });

    return entities.map((user) => UserMapper.toDomain(user));
  }

  async findByEmail(email: User['email']): Promise<NullableType<User>> {
    if (!email) return null;

    const entity = await this.usersRepository.findOne({
      where: { email },
      relations: ['photo', 'role', 'status'],
    });

    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByPhone(phone: User['phone']): Promise<NullableType<User>> {
    if (!phone) return null;

    const entity = await this.usersRepository.findOne({
      where: { phone },
      relations: ['photo', 'role', 'status'],
    });

    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByWechatOpenId(openId: string): Promise<NullableType<User>> {
    if (!openId) return null;

    const entity = await this.usersRepository.findOne({
      where: { wechatOpenId: openId },
      relations: ['photo', 'role', 'status'],
    });

    return entity ? UserMapper.toDomain(entity) : null;
  }

  async update(id: User['id'], payload: Partial<User>): Promise<User> {
    const entity = await this.usersRepository.findOne({
      where: { id: Number(id) },
      relations: ['photo', 'role', 'status'],
    });

    if (!entity) {
      throw new NotFoundException('User not found');
    }

    try {
      const updatedEntity = await this.usersRepository.save(
        this.usersRepository.create(
          UserMapper.toPersistence({
            ...UserMapper.toDomain(entity),
            ...payload,
          }),
        ),
      );

      return UserMapper.toDomain(updatedEntity);
    } catch (error) {
      // 处理数据库唯一约束异常
      handleUniqueConstraintError(error);
      throw error;
    }
  }

  async remove(id: User['id']): Promise<void> {
    await this.usersRepository.softDelete(id);
  }
}

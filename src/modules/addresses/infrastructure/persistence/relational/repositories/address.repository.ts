import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { AddressEntity } from '../entities/address.entity';
import { AddressRepository } from '../../address.repository';
import { AddressMapper } from '../mappers/address.mapper';
import { Address } from '../../../../domain/address';
import { NullableType } from '../../../../../../common/types/nullable.type';
import { FilterAddressDto, SortAddressDto } from '../../../../dto/query-address.dto';
import { IPaginationOptions } from '../../../../../../common/types/pagination-options';
import { buildFindOptions } from '../../../../../../infrastructure/database/utils/repository.utils';

@Injectable()
export class AddressRelationalRepository implements AddressRepository {
  constructor(
    @InjectRepository(AddressEntity)
    private readonly addressRepository: Repository<AddressEntity>,
  ) {}

  async create(data: Omit<Address, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Address> {
    const persistenceModel = AddressMapper.toPersistence(data);
    const newEntity = await this.addressRepository.save(this.addressRepository.create(persistenceModel));
    return AddressMapper.toDomain(newEntity);
  }

  async findManyWithPagination({
    userId,
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    userId: Address['userId'];
    filterOptions?: FilterAddressDto | null;
    sortOptions?: SortAddressDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Address[]> {
    const where: FindOptionsWhere<AddressEntity> = {
      userId: Number(userId),
    };

    if (filterOptions?.province) {
      where.province = filterOptions.province;
    }
    if (filterOptions?.city) {
      where.city = filterOptions.city;
    }

    const { skip, take, order } = buildFindOptions({
      paginationOptions,
      sortOptions,
      defaultOrder: { isDefault: 'DESC', createdAt: 'DESC' },
    });

    const entities = await this.addressRepository.find({
      skip,
      take,
      where,
      order,
    });

    return entities.map((entity) => AddressMapper.toDomain(entity));
  }

  async findById(id: Address['id']): Promise<NullableType<Address>> {
    const entity = await this.addressRepository.findOne({
      where: { id: Number(id) },
    });
    return entity ? AddressMapper.toDomain(entity) : null;
  }

  async findByIdAndUserId(id: Address['id'], userId: Address['userId']): Promise<NullableType<Address>> {
    const entity = await this.addressRepository.findOne({
      where: { id: Number(id), userId: Number(userId) },
    });
    return entity ? AddressMapper.toDomain(entity) : null;
  }

  async findDefaultByUserId(userId: Address['userId']): Promise<NullableType<Address>> {
    const entity = await this.addressRepository.findOne({
      where: { userId: Number(userId), isDefault: true },
    });
    return entity ? AddressMapper.toDomain(entity) : null;
  }

  async update(id: Address['id'], payload: Partial<Address>): Promise<Address | null> {
    const entity = await this.addressRepository.findOne({
      where: { id: Number(id) },
    });

    if (!entity) {
      return null;
    }

    const clonedPayload = { ...payload };
    delete clonedPayload.id;
    delete clonedPayload.userId;

    Object.assign(entity, clonedPayload);

    const updatedEntity = await this.addressRepository.save(entity);

    return AddressMapper.toDomain(updatedEntity);
  }

  async clearDefaultByUserId(userId: Address['userId']): Promise<void> {
    await this.addressRepository.update({ userId: Number(userId), isDefault: true }, { isDefault: false });
  }

  async remove(id: Address['id']): Promise<void> {
    await this.addressRepository.softDelete(id);
  }

  async countByUserId(userId: Address['userId']): Promise<number> {
    return this.addressRepository.count({
      where: { userId: Number(userId) },
    });
  }
}

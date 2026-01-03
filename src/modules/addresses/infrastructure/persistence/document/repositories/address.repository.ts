import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { AddressSchemaClass } from '../entities/address.schema';
import { AddressRepository } from '../../address.repository';
import { AddressMapper } from '../mappers/address.mapper';
import { Address } from '../../../../domain/address';
import { NullableType } from '../../../../../../common/types/nullable.type';
import { FilterAddressDto, SortAddressDto } from '../../../../dto/query-address.dto';
import { IPaginationOptions } from '../../../../../../common/types/pagination-options';

@Injectable()
export class AddressDocumentRepository implements AddressRepository {
  constructor(
    @InjectModel(AddressSchemaClass.name)
    private readonly addressModel: Model<AddressSchemaClass>,
  ) {}

  async create(data: Omit<Address, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Address> {
    const persistenceModel = AddressMapper.toPersistence(data);
    const createdAddress = new this.addressModel(persistenceModel);
    const addressObject = await createdAddress.save();
    return AddressMapper.toDomain(addressObject);
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
    const where: FilterQuery<AddressSchemaClass> = {
      userId: new Types.ObjectId(String(userId)),
      deletedAt: { $exists: false },
    };

    if (filterOptions?.province) {
      where.province = filterOptions.province;
    }
    if (filterOptions?.city) {
      where.city = filterOptions.city;
    }

    type SortValue = 1 | -1;
    const sortObject: Record<string, SortValue> = {};

    if (sortOptions) {
      for (const sort of sortOptions) {
        sortObject[sort.orderBy] = sort.order === 'ASC' ? 1 : -1;
      }
    }

    const finalSort =
      Object.keys(sortObject).length > 0 ? sortObject : { isDefault: -1 as SortValue, createdAt: -1 as SortValue };

    const addressObjects = await this.addressModel
      .find(where)
      .sort(finalSort)
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .limit(paginationOptions.limit);

    return addressObjects.map((addressObject) => AddressMapper.toDomain(addressObject));
  }

  async findById(id: Address['id']): Promise<NullableType<Address>> {
    const addressObject = await this.addressModel.findOne({
      _id: new Types.ObjectId(String(id)),
      deletedAt: { $exists: false },
    });
    return addressObject ? AddressMapper.toDomain(addressObject) : null;
  }

  async findByIdAndUserId(id: Address['id'], userId: Address['userId']): Promise<NullableType<Address>> {
    const addressObject = await this.addressModel.findOne({
      _id: new Types.ObjectId(String(id)),
      userId: new Types.ObjectId(String(userId)),
      deletedAt: { $exists: false },
    });
    return addressObject ? AddressMapper.toDomain(addressObject) : null;
  }

  async findDefaultByUserId(userId: Address['userId']): Promise<NullableType<Address>> {
    const addressObject = await this.addressModel.findOne({
      userId: new Types.ObjectId(String(userId)),
      isDefault: true,
      deletedAt: { $exists: false },
    });
    return addressObject ? AddressMapper.toDomain(addressObject) : null;
  }

  async update(id: Address['id'], payload: Partial<Address>): Promise<Address | null> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const addressObject = await this.addressModel.findOneAndUpdate(
      { _id: new Types.ObjectId(String(id)), deletedAt: { $exists: false } },
      { $set: clonedPayload },
      { new: true },
    );

    return addressObject ? AddressMapper.toDomain(addressObject) : null;
  }

  async clearDefaultByUserId(userId: Address['userId']): Promise<void> {
    await this.addressModel.updateMany(
      {
        userId: new Types.ObjectId(String(userId)),
        isDefault: true,
        deletedAt: { $exists: false },
      },
      { $set: { isDefault: false } },
    );
  }

  async remove(id: Address['id']): Promise<void> {
    await this.addressModel.updateOne({ _id: new Types.ObjectId(String(id)) }, { $set: { deletedAt: new Date() } });
  }

  async countByUserId(userId: Address['userId']): Promise<number> {
    return this.addressModel.countDocuments({
      userId: new Types.ObjectId(String(userId)),
      deletedAt: { $exists: false },
    });
  }
}

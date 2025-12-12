import { Address } from '../../../../domain/address';
import { AddressSchemaClass } from '../entities/address.schema';
import { Types } from 'mongoose';

export class AddressMapper {
  static toDomain(raw: AddressSchemaClass): Address {
    const domainEntity = new Address();
    domainEntity.id = raw._id.toString();
    domainEntity.userId = raw.userId.toString();
    domainEntity.name = raw.name;
    domainEntity.phone = raw.phone;
    domainEntity.province = raw.province;
    domainEntity.city = raw.city;
    domainEntity.district = raw.district;
    domainEntity.address = raw.address;
    domainEntity.isDefault = raw.isDefault;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt ?? new Date(0);
    return domainEntity;
  }

  static toPersistence(
    domainEntity: Omit<Address, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Partial<AddressSchemaClass> {
    return {
      userId: new Types.ObjectId(String(domainEntity.userId)),
      name: domainEntity.name,
      phone: domainEntity.phone,
      province: domainEntity.province,
      city: domainEntity.city,
      district: domainEntity.district,
      address: domainEntity.address,
      isDefault: domainEntity.isDefault,
    };
  }
}

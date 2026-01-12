import { Address } from '../../../../domain/address';
import { AddressEntity } from '../entities/address.entity';

export class AddressMapper {
  static toDomain(raw: AddressEntity): Address {
    const domainEntity = new Address();
    domainEntity.id = raw.id;
    domainEntity.userId = raw.userId;
    domainEntity.name = raw.name;
    domainEntity.phone = raw.phone;
    domainEntity.provinceCode = raw.provinceCode;
    domainEntity.cityCode = raw.cityCode;
    domainEntity.districtCode = raw.districtCode;
    domainEntity.province = raw.province;
    domainEntity.city = raw.city;
    domainEntity.district = raw.district;
    domainEntity.address = raw.address;
    domainEntity.isDefault = raw.isDefault;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;
    return domainEntity;
  }

  static toPersistence(domainEntity: Omit<Address, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): AddressEntity {
    const persistenceEntity = new AddressEntity();
    persistenceEntity.userId = Number(domainEntity.userId);
    persistenceEntity.name = domainEntity.name;
    persistenceEntity.phone = domainEntity.phone;
    persistenceEntity.provinceCode = domainEntity.provinceCode ?? null;
    persistenceEntity.cityCode = domainEntity.cityCode ?? null;
    persistenceEntity.districtCode = domainEntity.districtCode ?? null;
    persistenceEntity.province = domainEntity.province;
    persistenceEntity.city = domainEntity.city;
    persistenceEntity.district = domainEntity.district;
    persistenceEntity.address = domainEntity.address;
    persistenceEntity.isDefault = domainEntity.isDefault;
    return persistenceEntity;
  }
}

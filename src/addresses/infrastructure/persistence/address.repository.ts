import { NullableType } from '../../../utils/types/nullable.type';
import { Address } from '../../domain/address';
import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { FilterAddressDto, SortAddressDto } from '../../dto/query-address.dto';

export abstract class AddressRepository {
  abstract create(
    data: Omit<Address, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<Address>;

  abstract findManyWithPagination({
    userId,
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    userId: Address['userId'];
    filterOptions?: FilterAddressDto | null;
    sortOptions?: SortAddressDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Address[]>;

  abstract findById(id: Address['id']): Promise<NullableType<Address>>;

  abstract findByIdAndUserId(
    id: Address['id'],
    userId: Address['userId'],
  ): Promise<NullableType<Address>>;

  abstract findDefaultByUserId(userId: Address['userId']): Promise<NullableType<Address>>;

  abstract update(id: Address['id'], payload: DeepPartial<Address>): Promise<Address | null>;

  abstract clearDefaultByUserId(userId: Address['userId']): Promise<void>;

  abstract remove(id: Address['id']): Promise<void>;

  abstract countByUserId(userId: Address['userId']): Promise<number>;
}

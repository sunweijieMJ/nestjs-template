import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AddressRepository } from './infrastructure/persistence/address.repository';
import { Address } from './domain/address';
import { NullableType } from '../utils/types/nullable.type';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { FilterAddressDto, SortAddressDto } from './dto/query-address.dto';

const MAX_ADDRESSES_PER_USER = 20;

@Injectable()
export class AddressesService {
  private readonly logger = new Logger(AddressesService.name);

  constructor(private readonly addressRepository: AddressRepository) {}

  async create(userId: number | string, createAddressDto: CreateAddressDto): Promise<Address> {
    this.logger.log(`Creating address for user: ${userId}`);

    // Check address count limit
    const count = await this.addressRepository.countByUserId(userId);
    if (count >= MAX_ADDRESSES_PER_USER) {
      this.logger.warn(`User ${userId} has reached max addresses limit`);
      throw new ForbiddenException({
        error: 'maxAddressesReached',
        message: `Maximum ${MAX_ADDRESSES_PER_USER} addresses allowed per user`,
      });
    }

    // If this is the first address or marked as default, clear other defaults
    const isDefault = createAddressDto.isDefault ?? count === 0;
    if (isDefault) {
      await this.addressRepository.clearDefaultByUserId(userId);
    }

    const address = await this.addressRepository.create({
      userId,
      name: createAddressDto.name,
      phone: createAddressDto.phone,
      province: createAddressDto.province,
      city: createAddressDto.city,
      district: createAddressDto.district,
      address: createAddressDto.address,
      isDefault,
    });

    this.logger.log(`Address created successfully: ${address.id}`);
    return address;
  }

  findManyWithPagination({
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
    return this.addressRepository.findManyWithPagination({
      userId,
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  async findById(id: Address['id'], userId: Address['userId']): Promise<NullableType<Address>> {
    const address = await this.addressRepository.findByIdAndUserId(id, userId);
    if (!address) {
      throw new NotFoundException({
        error: 'addressNotFound',
      });
    }
    return address;
  }

  findDefaultByUserId(userId: Address['userId']): Promise<NullableType<Address>> {
    return this.addressRepository.findDefaultByUserId(userId);
  }

  async update(id: Address['id'], userId: Address['userId'], updateAddressDto: UpdateAddressDto): Promise<Address> {
    this.logger.log(`Updating address: ${id} for user: ${userId}`);

    // Check ownership
    const address = await this.addressRepository.findByIdAndUserId(id, userId);
    if (!address) {
      this.logger.warn(`Address ${id} not found or not owned by user ${userId}`);
      throw new NotFoundException({
        error: 'addressNotFound',
      });
    }

    // If setting as default, clear other defaults
    if (updateAddressDto.isDefault) {
      await this.addressRepository.clearDefaultByUserId(userId);
    }

    const updatedAddress = await this.addressRepository.update(id, updateAddressDto);
    if (!updatedAddress) {
      throw new NotFoundException({
        error: 'addressNotFound',
      });
    }

    this.logger.log(`Address updated successfully: ${id}`);
    return updatedAddress;
  }

  async setDefault(id: Address['id'], userId: Address['userId']): Promise<Address> {
    this.logger.log(`Setting address ${id} as default for user: ${userId}`);

    // Check ownership
    const address = await this.addressRepository.findByIdAndUserId(id, userId);
    if (!address) {
      this.logger.warn(`Address ${id} not found or not owned by user ${userId}`);
      throw new NotFoundException({
        error: 'addressNotFound',
      });
    }

    // Clear other defaults
    await this.addressRepository.clearDefaultByUserId(userId);

    // Set this as default
    const updatedAddress = await this.addressRepository.update(id, { isDefault: true });
    if (!updatedAddress) {
      throw new NotFoundException({
        error: 'addressNotFound',
      });
    }

    this.logger.log(`Address ${id} set as default`);
    return updatedAddress;
  }

  async remove(id: Address['id'], userId: Address['userId']): Promise<void> {
    this.logger.log(`Removing address: ${id} for user: ${userId}`);

    // Check ownership
    const address = await this.addressRepository.findByIdAndUserId(id, userId);
    if (!address) {
      this.logger.warn(`Address ${id} not found or not owned by user ${userId}`);
      throw new NotFoundException({
        error: 'addressNotFound',
      });
    }

    await this.addressRepository.remove(id);

    // If deleted address was default, make another one default
    if (address.isDefault) {
      const addresses = await this.addressRepository.findManyWithPagination({
        userId,
        paginationOptions: { page: 1, limit: 1 },
      });
      if (addresses.length > 0) {
        await this.addressRepository.update(addresses[0].id, { isDefault: true });
      }
    }

    this.logger.log(`Address removed successfully: ${id}`);
  }
}

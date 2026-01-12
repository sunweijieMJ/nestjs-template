import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AddressRepository } from './infrastructure/persistence/address.repository';
import { Address } from './domain/address';
import { NullableType } from '../../common/types/nullable.type';
import { IPaginationOptions } from '../../common/types/pagination-options';
import { FilterAddressDto, SortAddressDto } from './dto/query-address.dto';
import { RegionsService } from '../regions/regions.service';

const MAX_ADDRESSES_PER_USER = 20;

@Injectable()
export class AddressesService {
  private readonly logger = new Logger(AddressesService.name);

  constructor(
    private readonly addressRepository: AddressRepository,
    private readonly regionsService: RegionsService,
  ) {}

  /**
   * Validate and fill region data
   * All three codes must be provided together or none at all
   * When codes are provided, names will be auto-filled from region data
   */
  private async validateAndFillRegionData(dto: {
    provinceCode?: string;
    cityCode?: string;
    districtCode?: string;
    province?: string;
    city?: string;
    district?: string;
  }): Promise<{
    provinceCode: string | null;
    cityCode: string | null;
    districtCode: string | null;
    province: string;
    city: string;
    district: string;
  }> {
    const { provinceCode, cityCode, districtCode, province, city, district } = dto;

    // Check if any code is provided
    const hasAnyCode = Boolean(provinceCode || cityCode || districtCode);
    const hasAllCodes = Boolean(provinceCode && cityCode && districtCode);

    // If any code is provided, all must be provided
    if (hasAnyCode && !hasAllCodes) {
      this.logger.warn('Incomplete region codes provided');
      throw new BadRequestException({
        error: 'incompleteRegionCodes',
        message: 'Must provide all three region codes (province, city, district) or none at all',
      });
    }

    // If no codes provided, names are required (validated by DTO)
    if (!hasAllCodes) {
      if (!province || !city || !district) {
        throw new BadRequestException({
          error: 'missingRegionNames',
          message: 'Province, city, and district names are required when region codes are not provided',
        });
      }
      return {
        provinceCode: null,
        cityCode: null,
        districtCode: null,
        province,
        city,
        district,
      };
    }

    // Validate region code combination and get region objects in one call
    const result = await this.regionsService.validateRegionCombination(provinceCode!, cityCode!, districtCode!);

    if (!result.valid) {
      this.logger.warn(`Invalid region combination: ${provinceCode}, ${cityCode}, ${districtCode}`);
      throw new BadRequestException({
        error: 'invalidRegionCombination',
        message: 'Invalid province/city/district combination',
      });
    }

    // Use region objects returned from validation (avoids duplicate queries)
    const [provinceRegion, cityRegion, districtRegion] = result.regions;

    return {
      provinceCode: provinceCode!,
      cityCode: cityCode!,
      districtCode: districtCode!,
      province: provinceRegion.name,
      city: cityRegion.name,
      district: districtRegion.name,
    };
  }

  async create(userId: number, createAddressDto: CreateAddressDto): Promise<Address> {
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

    // Validate and auto-fill region data
    const regionData = await this.validateAndFillRegionData({
      provinceCode: createAddressDto.provinceCode,
      cityCode: createAddressDto.cityCode,
      districtCode: createAddressDto.districtCode,
      province: createAddressDto.province,
      city: createAddressDto.city,
      district: createAddressDto.district,
    });

    // If this is the first address or marked as default, clear other defaults
    const isDefault = createAddressDto.isDefault ?? count === 0;
    if (isDefault) {
      await this.addressRepository.clearDefaultByUserId(userId);
    }

    const address = await this.addressRepository.create({
      userId,
      name: createAddressDto.name,
      phone: createAddressDto.phone,
      provinceCode: regionData.provinceCode,
      cityCode: regionData.cityCode,
      districtCode: regionData.districtCode,
      province: regionData.province,
      city: regionData.city,
      district: regionData.district,
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

  async findManyWithPaginationAndCount({
    userId,
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    userId: Address['userId'];
    filterOptions?: FilterAddressDto | null;
    sortOptions?: SortAddressDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<{ data: Address[]; total: number }> {
    const [data, total] = await Promise.all([
      this.addressRepository.findManyWithPagination({
        userId,
        filterOptions,
        sortOptions,
        paginationOptions,
      }),
      this.addressRepository.countByUserId(userId),
    ]);
    return { data, total };
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

    const updateData: Partial<Address> = { ...updateAddressDto };

    // Only validate region codes if code fields are being updated
    const hasRegionCodeUpdate =
      updateAddressDto.provinceCode !== undefined ||
      updateAddressDto.cityCode !== undefined ||
      updateAddressDto.districtCode !== undefined;

    if (hasRegionCodeUpdate) {
      // When updating region codes, validate the combination
      const regionData = await this.validateAndFillRegionData({
        provinceCode: updateAddressDto.provinceCode ?? address.provinceCode ?? undefined,
        cityCode: updateAddressDto.cityCode ?? address.cityCode ?? undefined,
        districtCode: updateAddressDto.districtCode ?? address.districtCode ?? undefined,
        province: updateAddressDto.province || address.province,
        city: updateAddressDto.city || address.city,
        district: updateAddressDto.district || address.district,
      });

      Object.assign(updateData, regionData);
    } else {
      // Only updating name fields without code changes - no validation needed
      if (updateAddressDto.province !== undefined) {
        updateData.province = updateAddressDto.province;
      }
      if (updateAddressDto.city !== undefined) {
        updateData.city = updateAddressDto.city;
      }
      if (updateAddressDto.district !== undefined) {
        updateData.district = updateAddressDto.district;
      }
    }

    // If setting as default, clear other defaults
    if (updateAddressDto.isDefault) {
      await this.addressRepository.clearDefaultByUserId(userId);
    }

    const updatedAddress = await this.addressRepository.update(id, updateData);
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

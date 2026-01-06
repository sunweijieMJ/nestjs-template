import { Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { NullableType } from '../../common/types/nullable.type';
import { FilterUserDto, SortUserDto } from './dto/query-user.dto';
import { UserRepository } from './infrastructure/persistence/user.repository';
import { User } from './domain/user';
import bcrypt from 'bcryptjs';
import { AuthProvidersEnum } from '../auth/auth-providers.enum';
import { FilesService } from '../../modules/files/files.service';
import { RoleEnum } from '../../common/enums/roles/roles.enum';
import { StatusEnum } from '../../common/enums/statuses/statuses.enum';
import { IPaginationOptions } from '../../common/types/pagination-options';
import { FileType } from '../../modules/files/domain/file';
import { Role } from '../../common/enums/roles/role';
import { Status } from '../../common/enums/statuses/status';
import { UpdateUserDto } from './dto/update-user.dto';
import { RoleDto } from '../../common/enums/roles/role.dto';
import { StatusDto } from '../../common/enums/statuses/status.dto';
import { throwValidationError } from '../../common/utils/exceptions.util';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UserRepository,
    private readonly filesService: FilesService,
  ) {}

  private validateRole(roleDto: RoleDto | null | undefined): Role | undefined {
    if (!roleDto?.id) {
      return undefined;
    }

    const isValidRole = Object.values(RoleEnum).map(String).includes(String(roleDto.id));

    if (!isValidRole) {
      throwValidationError('role', 'roleNotExists');
    }

    return { id: roleDto.id };
  }

  private validateStatus(statusDto: StatusDto | undefined): Status | undefined {
    if (!statusDto?.id) {
      return undefined;
    }

    const isValidStatus = Object.values(StatusEnum).map(String).includes(String(statusDto.id));

    if (!isValidStatus) {
      throwValidationError('status', 'statusNotExists');
    }

    return { id: statusDto.id };
  }

  private async validatePhoto(photoDto: { id: string } | null | undefined): Promise<FileType | null | undefined> {
    if (photoDto === null) {
      return null;
    }

    if (!photoDto?.id) {
      return undefined;
    }

    const fileObject = await this.filesService.findById(photoDto.id);
    if (!fileObject) {
      throwValidationError('photo', 'imageNotExists');
    }

    return fileObject;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(
      `Creating user with email: ${createUserDto.email ?? 'N/A'}, phone: ${createUserDto.phone ? createUserDto.phone.substring(0, 3) + '****' + createUserDto.phone.substring(7) : 'N/A'}`,
    );
    // Do not remove comment below.
    // <creating-property />

    let password: string | undefined = undefined;

    if (createUserDto.password) {
      const salt = await bcrypt.genSalt();
      password = await bcrypt.hash(createUserDto.password, salt);
    }

    let email: string | null = null;

    if (createUserDto.email) {
      const userObject = await this.usersRepository.findByEmail(createUserDto.email);
      if (userObject) {
        throwValidationError('email', 'emailAlreadyExists');
      }
      email = createUserDto.email;
    }

    let phone: string | null = null;

    if (createUserDto.phone) {
      const userObject = await this.usersRepository.findByPhone(createUserDto.phone);
      if (userObject) {
        throwValidationError('phone', 'phoneAlreadyExists');
      }
      phone = createUserDto.phone;
    }

    const photo = await this.validatePhoto(createUserDto.photo);
    const role = this.validateRole(createUserDto.role);
    const status = this.validateStatus(createUserDto.status);

    const user = await this.usersRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
      firstName: createUserDto.firstName ?? null,
      lastName: createUserDto.lastName ?? null,
      email: email,
      phone: phone,
      nickname: createUserDto.nickname ?? null,
      gender: createUserDto.gender ?? 0,
      birthday: createUserDto.birthday ?? null,
      password: password,
      photo: photo,
      role: role,
      status: status,
      provider: createUserDto.provider ?? AuthProvidersEnum.email,
      wechatOpenId: createUserDto.wechatOpenId ?? null,
      wechatUnionId: createUserDto.wechatUnionId ?? null,
    });

    this.logger.log(`User created successfully: ${user.id}`);
    return user;
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterUserDto | null;
    sortOptions?: SortUserDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<User[]> {
    return this.usersRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  findById(id: User['id']): Promise<NullableType<User>> {
    return this.usersRepository.findById(id);
  }

  findByIds(ids: User['id'][]): Promise<User[]> {
    return this.usersRepository.findByIds(ids);
  }

  findByEmail(email: User['email']): Promise<NullableType<User>> {
    return this.usersRepository.findByEmail(email);
  }

  findByPhone(phone: User['phone']): Promise<NullableType<User>> {
    return this.usersRepository.findByPhone(phone);
  }

  findByWechatOpenId(openId: string): Promise<NullableType<User>> {
    return this.usersRepository.findByWechatOpenId(openId);
  }

  async update(id: User['id'], updateUserDto: UpdateUserDto): Promise<User | null> {
    this.logger.log(`Updating user: ${id}`);
    // Do not remove comment below.
    // <updating-property />

    let password: string | undefined = undefined;

    if (updateUserDto.password) {
      const userObject = await this.usersRepository.findById(id);

      if (userObject && userObject?.password !== updateUserDto.password) {
        const salt = await bcrypt.genSalt();
        password = await bcrypt.hash(updateUserDto.password, salt);
      }
    }

    let email: string | null | undefined = undefined;

    if (updateUserDto.email) {
      const userObject = await this.usersRepository.findByEmail(updateUserDto.email);

      if (userObject && userObject.id !== id) {
        throwValidationError('email', 'emailAlreadyExists');
      }

      email = updateUserDto.email;
    } else if (updateUserDto.email === null) {
      email = null;
    }

    let phone: string | null | undefined = undefined;

    if (updateUserDto.phone) {
      const userObject = await this.usersRepository.findByPhone(updateUserDto.phone);

      if (userObject && userObject.id !== id) {
        throwValidationError('phone', 'phoneAlreadyExists');
      }

      phone = updateUserDto.phone;
    } else if (updateUserDto.phone === null) {
      phone = null;
    }

    const photo = await this.validatePhoto(updateUserDto.photo);
    const role = this.validateRole(updateUserDto.role);
    const status = this.validateStatus(updateUserDto.status);

    const user = await this.usersRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      firstName: updateUserDto.firstName,
      lastName: updateUserDto.lastName,
      email,
      phone,
      nickname: updateUserDto.nickname,
      gender: updateUserDto.gender,
      birthday: updateUserDto.birthday,
      password,
      photo,
      role,
      status,
      provider: updateUserDto.provider,
    });

    this.logger.log(`User updated successfully: ${id}`);
    return user;
  }

  async remove(id: User['id']): Promise<void> {
    this.logger.log(`Removing user: ${id}`);
    await this.usersRepository.remove(id);
    this.logger.log(`User removed successfully: ${id}`);
  }
}

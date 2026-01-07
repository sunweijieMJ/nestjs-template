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
import { maskEmail, maskPhone } from '../../common/utils/sanitize.utils';
import { validateEmailUniqueness, validatePhoneUniqueness } from '../../common/utils/validation.utils';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UserRepository,
    private readonly filesService: FilesService,
  ) {}

  /**
   * 加密密码
   * @param password - 明文密码
   * @returns 加密后的密码
   */
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  /**
   * 验证角色是否有效
   * @param roleDto - 角色数据传输对象
   * @returns 验证后的角色对象，如果无效则返回 undefined
   * @throws 当角色不存在时抛出验证错误
   */
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

  /**
   * 验证状态是否有效
   * @param statusDto - 状态数据传输对象
   * @returns 验证后的状态对象，如果无效则返回 undefined
   * @throws 当状态不存在时抛出验证错误
   */
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

  /**
   * 验证照片文件是否有效
   * @param photoDto - 照片数据传输对象
   * @returns 验证后的文件对象，如果无效则返回 null 或 undefined
   * @throws 当照片文件不存在时抛出验证错误
   */
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

  /**
   * 创建新用户
   * @param createUserDto - 创建用户数据传输对象
   * @returns 创建成功的用户对象
   * @throws 当邮箱或手机号已存在时抛出验证错误
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(
      `Creating user with email: ${createUserDto.email ? maskEmail(createUserDto.email) : 'N/A'}, phone: ${createUserDto.phone ? maskPhone(createUserDto.phone) : 'N/A'}`,
    );
    // Do not remove comment below.
    // <creating-property />

    let password: string | undefined = undefined;

    if (createUserDto.password) {
      password = await this.hashPassword(createUserDto.password);
    }

    let email: string | null = null;

    if (createUserDto.email) {
      const userObject = await this.usersRepository.findByEmail(createUserDto.email);
      validateEmailUniqueness(userObject);
      email = createUserDto.email;
    }

    let phone: string | null = null;

    if (createUserDto.phone) {
      const userObject = await this.usersRepository.findByPhone(createUserDto.phone);
      validatePhoneUniqueness(userObject);
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

  /**
   * 分页查询用户列表
   * @param filterOptions - 过滤条件
   * @param sortOptions - 排序选项
   * @param paginationOptions - 分页选项
   * @returns 用户列表
   */
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

  /**
   * 根据ID查找用户
   * @param id - 用户ID
   * @returns 用户对象或 null
   */
  findById(id: User['id']): Promise<NullableType<User>> {
    return this.usersRepository.findById(id);
  }

  /**
   * 根据ID列表批量查找用户
   * @param ids - 用户ID列表
   * @returns 用户对象列表
   */
  findByIds(ids: User['id'][]): Promise<User[]> {
    return this.usersRepository.findByIds(ids);
  }

  /**
   * 根据邮箱查找用户
   * @param email - 用户邮箱
   * @returns 用户对象或 null
   */
  findByEmail(email: User['email']): Promise<NullableType<User>> {
    return this.usersRepository.findByEmail(email);
  }

  /**
   * 根据手机号查找用户
   * @param phone - 用户手机号
   * @returns 用户对象或 null
   */
  findByPhone(phone: User['phone']): Promise<NullableType<User>> {
    return this.usersRepository.findByPhone(phone);
  }

  /**
   * 根据微信 OpenID 查找用户
   * @param openId - 微信 OpenID
   * @returns 用户对象或 null
   */
  findByWechatOpenId(openId: string): Promise<NullableType<User>> {
    return this.usersRepository.findByWechatOpenId(openId);
  }

  /**
   * 更新用户信息
   * @param id - 用户ID
   * @param updateUserDto - 更新用户数据传输对象
   * @returns 更新后的用户对象或 null
   * @throws 当邮箱或手机号已被其他用户占用时抛出验证错误
   */
  async update(id: User['id'], updateUserDto: UpdateUserDto): Promise<User | null> {
    this.logger.log(`Updating user: ${id}`);
    // Do not remove comment below.
    // <updating-property />

    let password: string | undefined = undefined;

    if (updateUserDto.password) {
      const userObject = await this.usersRepository.findById(id);

      if (userObject && userObject?.password !== updateUserDto.password) {
        password = await this.hashPassword(updateUserDto.password);
      }
    }

    let email: string | null | undefined = undefined;

    if (updateUserDto.email) {
      const userObject = await this.usersRepository.findByEmail(updateUserDto.email);
      validateEmailUniqueness(userObject, id);
      email = updateUserDto.email;
    } else if (updateUserDto.email === null) {
      email = null;
    }

    let phone: string | null | undefined = undefined;

    if (updateUserDto.phone) {
      const userObject = await this.usersRepository.findByPhone(updateUserDto.phone);
      validatePhoneUniqueness(userObject, id);
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

  /**
   * 删除用户（软删除）
   * @param id - 用户ID
   */
  async remove(id: User['id']): Promise<void> {
    this.logger.log(`Removing user: ${id}`);
    await this.usersRepository.remove(id);
    this.logger.log(`User removed successfully: ${id}`);
  }
}

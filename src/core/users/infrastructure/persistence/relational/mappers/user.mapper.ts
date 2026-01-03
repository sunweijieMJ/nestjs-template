import { FileEntity } from '../../../../../../modules/files/infrastructure/persistence/relational/entities/file.entity';
import { FileMapper } from '../../../../../../modules/files/infrastructure/persistence/relational/mappers/file.mapper';
import { RoleEntity } from '../../../../../../common/enums/roles/role.entity';
import { StatusEntity } from '../../../../../../common/enums/statuses/status.entity';
import { User } from '../../../../domain/user';
import { UserEntity } from '../entities/user.entity';

export class UserMapper {
  static toDomain(raw: UserEntity): User {
    const domainEntity = new User();
    domainEntity.id = raw.id;
    domainEntity.email = raw.email;
    domainEntity.password = raw.password;
    domainEntity.provider = raw.provider;
    domainEntity.firstName = raw.firstName;
    domainEntity.lastName = raw.lastName;
    domainEntity.phone = raw.phone;
    domainEntity.nickname = raw.nickname;
    domainEntity.gender = raw.gender;
    domainEntity.birthday = raw.birthday;
    if (raw.photo) {
      domainEntity.photo = FileMapper.toDomain(raw.photo);
    } else {
      domainEntity.photo = null;
    }
    domainEntity.role = raw.role;
    domainEntity.status = raw.status;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;
    domainEntity.wechatOpenId = raw.wechatOpenId;
    domainEntity.wechatUnionId = raw.wechatUnionId;
    return domainEntity;
  }

  static toPersistence(domainEntity: User): UserEntity {
    let role: RoleEntity | undefined = undefined;

    if (domainEntity.role) {
      role = new RoleEntity();
      role.id = Number(domainEntity.role.id);
    }

    let photo: FileEntity | undefined | null = undefined;

    if (domainEntity.photo) {
      photo = new FileEntity();
      photo.id = domainEntity.photo.id;
      photo.path = domainEntity.photo.path;
    } else if (domainEntity.photo === null) {
      photo = null;
    }

    let status: StatusEntity | undefined = undefined;

    if (domainEntity.status) {
      status = new StatusEntity();
      status.id = Number(domainEntity.status.id);
    }

    const persistenceEntity = new UserEntity();
    if (domainEntity.id && typeof domainEntity.id === 'number') {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.email = domainEntity.email;
    persistenceEntity.password = domainEntity.password;
    persistenceEntity.provider = domainEntity.provider;
    persistenceEntity.firstName = domainEntity.firstName;
    persistenceEntity.lastName = domainEntity.lastName;
    persistenceEntity.phone = domainEntity.phone;
    persistenceEntity.nickname = domainEntity.nickname;
    persistenceEntity.gender = domainEntity.gender;
    persistenceEntity.birthday = domainEntity.birthday;
    persistenceEntity.photo = photo;
    persistenceEntity.role = role;
    persistenceEntity.status = status;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    persistenceEntity.deletedAt = domainEntity.deletedAt;
    persistenceEntity.wechatOpenId = domainEntity.wechatOpenId;
    persistenceEntity.wechatUnionId = domainEntity.wechatUnionId;
    return persistenceEntity;
  }
}

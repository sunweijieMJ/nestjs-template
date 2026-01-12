import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import crypto from 'crypto';
import { hashPassword } from '../../../../../common/utils/crypto.utils';
import { RoleEnum } from '../../../../../common/enums/roles/roles.enum';
import { StatusEnum } from '../../../../../common/enums/statuses/statuses.enum';
import { UserEntity } from '../../../../../core/users/infrastructure/persistence/relational/entities/user.entity';

/**
 * Helper to generate MD5 hash of password (simulating frontend behavior)
 * This ensures seed passwords are compatible with MD5-based authentication
 */
function md5(password: string): string {
  return crypto.createHash('md5').update(password).digest('hex');
}

@Injectable()
export class UserSeedService {
  constructor(
    @InjectRepository(UserEntity)
    private repository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
    const countAdmin = await this.repository.count({
      where: {
        role: {
          id: RoleEnum.admin,
        },
      },
    });

    if (!countAdmin) {
      // Hash the MD5 of the password (frontend sends MD5, backend stores bcrypt of MD5)
      const password = await hashPassword(md5('Secret00'));

      await this.repository.save(
        this.repository.create({
          firstName: 'Super',
          lastName: 'Admin',
          email: 'admin@example.com',
          password,
          role: {
            id: RoleEnum.admin,
            name: 'Admin',
          },
          status: {
            id: StatusEnum.active,
            name: 'Active',
          },
        }),
      );
    }

    const countUser = await this.repository.count({
      where: {
        role: {
          id: RoleEnum.user,
        },
      },
    });

    if (!countUser) {
      // Hash the MD5 of the password (frontend sends MD5, backend stores bcrypt of MD5)
      const password = await hashPassword(md5('Secret00'));

      await this.repository.save(
        this.repository.create({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password,
          role: {
            id: RoleEnum.user,
            name: 'Admin',
          },
          status: {
            id: StatusEnum.active,
            name: 'Active',
          },
        }),
      );
    }
  }
}

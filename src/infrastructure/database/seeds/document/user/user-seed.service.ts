import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Model } from 'mongoose';
import { RoleEnum } from '../../../../../common/enums/roles/roles.enum';
import { StatusEnum } from '../../../../../common/enums/statuses/statuses.enum';
import { UserSchemaClass } from '../../../../../core/users/infrastructure/persistence/document/entities/user.schema';

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
    @InjectModel(UserSchemaClass.name)
    private readonly model: Model<UserSchemaClass>,
  ) {}

  async run(): Promise<void> {
    const admin = await this.model.findOne({
      email: 'admin@example.com',
    });

    if (!admin) {
      const salt = await bcrypt.genSalt();
      // Hash the MD5 of the password (frontend sends MD5, backend stores bcrypt of MD5)
      const password = await bcrypt.hash(md5('Secret00'), salt);

      const data = new this.model({
        email: 'admin@example.com',
        password: password,
        firstName: 'Super',
        lastName: 'Admin',
        role: {
          _id: RoleEnum.admin.toString(),
        },
        status: {
          _id: StatusEnum.active.toString(),
        },
      });
      await data.save();
    }

    const user = await this.model.findOne({
      email: 'john.doe@example.com',
    });

    if (!user) {
      const salt = await bcrypt.genSalt();
      // Hash the MD5 of the password (frontend sends MD5, backend stores bcrypt of MD5)
      const password = await bcrypt.hash(md5('Secret00'), salt);

      const data = new this.model({
        email: 'john.doe@example.com',
        password: password,
        firstName: 'John',
        lastName: 'Doe',
        role: {
          _id: RoleEnum.user.toString(),
        },
        status: {
          _id: StatusEnum.active.toString(),
        },
      });

      await data.save();
    }
  }
}

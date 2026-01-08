import { ApiProperty } from '@nestjs/swagger';
import databaseConfig from '../../../infrastructure/database/config/database.config';
import { DatabaseConfig } from '../../../infrastructure/database/config/database-config.type';
import { NotificationCategory } from './notification';

const idType = (databaseConfig() as DatabaseConfig).isDocumentDatabase ? String : Number;

export class NotificationSetting {
  @ApiProperty({
    type: idType,
  })
  id: number | string;

  @ApiProperty({
    type: idType,
    description: 'User ID who owns this setting',
  })
  userId: number | string;

  @ApiProperty({
    enum: NotificationCategory,
    example: NotificationCategory.ORDER,
  })
  category: NotificationCategory;

  @ApiProperty({
    example: true,
    type: Boolean,
  })
  enableInApp: boolean;

  @ApiProperty({
    example: true,
    type: Boolean,
  })
  enableEmail: boolean;

  @ApiProperty({
    example: false,
    type: Boolean,
  })
  enableSms: boolean;

  @ApiProperty({
    example: true,
    type: Boolean,
  })
  enablePush: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

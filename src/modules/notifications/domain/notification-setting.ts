import { ApiProperty } from '@nestjs/swagger';
import { NotificationCategory } from './notification';

export class NotificationSetting {
  @ApiProperty({
    type: Number,
  })
  id: number;

  @ApiProperty({
    type: Number,
    description: 'User ID who owns this setting',
  })
  userId: number;

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

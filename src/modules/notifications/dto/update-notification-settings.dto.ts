import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum } from 'class-validator';
import { NotificationCategory } from '../domain/notification';

export class UpdateNotificationSettingsDto {
  @ApiProperty({
    enum: NotificationCategory,
    example: NotificationCategory.ORDER,
  })
  @IsEnum(NotificationCategory)
  category: NotificationCategory;

  @ApiProperty({
    example: true,
    type: Boolean,
  })
  @IsBoolean()
  enableInApp: boolean;

  @ApiProperty({
    example: true,
    type: Boolean,
  })
  @IsBoolean()
  enableEmail: boolean;

  @ApiProperty({
    example: false,
    type: Boolean,
  })
  @IsBoolean()
  enableSms: boolean;

  @ApiProperty({
    example: true,
    type: Boolean,
  })
  @IsBoolean()
  enablePush: boolean;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsNotEmpty, IsOptional, IsObject, IsArray, MaxLength } from 'class-validator';
import { NotificationType, NotificationCategory, NotificationChannel } from '../domain/notification';

export class CreateNotificationDto {
  @ApiProperty({
    type: Number,
    description: 'User ID to receive the notification',
  })
  @IsNotEmpty()
  userId: number;

  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.INFO,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    enum: NotificationCategory,
    example: NotificationCategory.SYSTEM,
  })
  @IsEnum(NotificationCategory)
  category: NotificationCategory;

  @ApiProperty({
    example: 'Your order has been shipped',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    example: 'Your order #12345 has been shipped and will arrive in 2-3 days.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    type: Object,
    description: 'Additional metadata in JSON format',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiProperty({
    enum: NotificationChannel,
    isArray: true,
    example: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
  })
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];
}

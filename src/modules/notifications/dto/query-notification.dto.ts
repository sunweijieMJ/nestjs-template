import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { NotificationCategory } from '../domain/notification';

export class QueryNotificationDto {
  @ApiPropertyOptional({
    type: Number,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : 1))
  page?: number = 1;

  @ApiPropertyOptional({
    type: Number,
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : 10))
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: NotificationCategory,
    description: 'Filter by notification category',
  })
  @IsOptional()
  @IsEnum(NotificationCategory)
  category?: NotificationCategory;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Filter by read status',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isRead?: boolean;
}

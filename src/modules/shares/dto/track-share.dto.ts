import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsObject } from 'class-validator';
import { ShareLogAction } from '../domain/share-log';

export class TrackShareDto {
  @ApiProperty({
    enum: ShareLogAction,
    example: ShareLogAction.VIEW,
  })
  @IsEnum(ShareLogAction)
  action: ShareLogAction;

  @ApiPropertyOptional({
    type: Object,
    description: 'Additional metadata in JSON format',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

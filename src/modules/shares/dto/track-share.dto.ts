import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsObject, ValidateBy } from 'class-validator';
import { ShareLogAction } from '../domain/share-log';

/** metadata 序列化后的最大长度 */
const MAX_METADATA_JSON_LENGTH = 2048;

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
  @ValidateBy({
    name: 'maxJsonLength',
    validator: {
      validate: (value: unknown) => JSON.stringify(value).length <= MAX_METADATA_JSON_LENGTH,
      defaultMessage: () => 'metadataTooLarge',
    },
  })
  metadata?: Record<string, unknown>;
}

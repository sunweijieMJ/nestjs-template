import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsObject, ValidateBy } from 'class-validator';
import { ShareLogAction } from '../domain/share-log';

/** 客户端可上报的行为 */
const PUBLIC_TRACK_ACTIONS = [ShareLogAction.VIEW, ShareLogAction.CLICK];

/** metadata 序列化后的最大长度 */
const MAX_METADATA_JSON_LENGTH = 2048;

export class TrackShareDto {
  @ApiProperty({
    enum: PUBLIC_TRACK_ACTIONS,
    example: ShareLogAction.VIEW,
    description: '转化由服务端业务调用 SharesService.trackShare 记录，不接受客户端上报',
  })
  @IsIn(PUBLIC_TRACK_ACTIONS)
  action: ShareLogAction.VIEW | ShareLogAction.CLICK;

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

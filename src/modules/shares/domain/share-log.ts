import { ApiProperty } from '@nestjs/swagger';
import databaseConfig from '../../../infrastructure/database/config/database.config';
import { DatabaseConfig } from '../../../infrastructure/database/config/database-config.type';

const idType = (databaseConfig() as DatabaseConfig).isDocumentDatabase ? String : Number;

export enum ShareLogAction {
  VIEW = 'VIEW',
  CLICK = 'CLICK',
  CONVERSION = 'CONVERSION',
}

export class ShareLog {
  @ApiProperty({
    type: idType,
  })
  id: number | string;

  @ApiProperty({
    type: idType,
    description: 'Share ID this log belongs to',
  })
  shareId: number | string;

  @ApiProperty({
    enum: ShareLogAction,
    example: ShareLogAction.VIEW,
  })
  action: ShareLogAction;

  @ApiProperty({
    example: '192.168.1.1',
    type: String,
    required: false,
  })
  visitorIp?: string;

  @ApiProperty({
    example: 'Mozilla/5.0...',
    type: String,
    required: false,
  })
  userAgent?: string;

  @ApiProperty({
    example: 'WECHAT',
    type: String,
    required: false,
  })
  platform?: string;

  @ApiProperty({
    type: Object,
    required: false,
    description: 'Additional metadata in JSON format',
  })
  metadata?: Record<string, unknown>;

  @ApiProperty()
  createdAt: Date;
}

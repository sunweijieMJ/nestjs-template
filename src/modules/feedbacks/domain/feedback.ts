import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import databaseConfig from '../../../infrastructure/database/config/database.config';
import { DatabaseConfig } from '../../../infrastructure/database/config/database-config.type';

const idType = (databaseConfig() as DatabaseConfig).isDocumentDatabase ? String : Number;

export enum FeedbackType {
  BUG = 'bug',
  SUGGESTION = 'suggestion',
  COMPLAINT = 'complaint',
  OTHER = 'other',
}

export enum FeedbackStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export class Feedback {
  @ApiProperty({ type: idType })
  id: number | string;

  @ApiProperty({ type: idType })
  userId: number | string;

  @ApiProperty({ enum: FeedbackType })
  type: FeedbackType;

  @ApiProperty({ type: String })
  content: string;

  @ApiPropertyOptional({ type: [String] })
  images?: string[];

  @ApiPropertyOptional({ type: String })
  contact?: string;

  @ApiProperty({ enum: FeedbackStatus })
  status: FeedbackStatus;

  @ApiPropertyOptional({ type: String })
  reply?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;
}

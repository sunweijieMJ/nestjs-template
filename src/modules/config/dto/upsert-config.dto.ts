import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class UpsertConfigDto {
  @ApiProperty({
    type: Object,
    example: { primaryColor: '#1890ff', darkMode: false },
  })
  @IsObject()
  value: Record<string, unknown>;
}

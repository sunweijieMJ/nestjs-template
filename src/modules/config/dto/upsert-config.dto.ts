import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional } from 'class-validator';

export class UpsertConfigDto {
  @ApiProperty({
    type: Object,
    example: { primaryColor: '#1890ff', darkMode: false },
  })
  @IsObject()
  value: Record<string, unknown>;

  @ApiPropertyOptional({ type: Boolean, description: '是否公开，新建时默认 false，更新时不传则保持不变' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

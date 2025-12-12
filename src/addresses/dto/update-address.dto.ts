import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeTransformer } from '../../utils/transformers/sanitize.transformer';

export class UpdateAddressDto {
  @ApiPropertyOptional({ example: 'John Doe', type: String })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(sanitizeTransformer)
  name?: string;

  @ApiPropertyOptional({ example: '13800138000', type: String })
  @IsOptional()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: 'phone must be a valid Chinese mobile number' })
  phone?: string;

  @ApiPropertyOptional({ example: '北京市', type: String })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(sanitizeTransformer)
  province?: string;

  @ApiPropertyOptional({ example: '北京市', type: String })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(sanitizeTransformer)
  city?: string;

  @ApiPropertyOptional({ example: '朝阳区', type: String })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(sanitizeTransformer)
  district?: string;

  @ApiPropertyOptional({ example: '建国路88号SOHO现代城', type: String })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(sanitizeTransformer)
  address?: string;

  @ApiPropertyOptional({ example: false, type: Boolean })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

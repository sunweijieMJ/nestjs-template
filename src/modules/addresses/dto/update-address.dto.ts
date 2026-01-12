import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeTransformer } from '../../../common/transformers/sanitize.transformer';
import { IsRegionCode } from '../../../common/decorators/is-region-code.decorator';

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

  @ApiPropertyOptional({ example: '110000000000', type: String, description: 'Province region code (12 digits)' })
  @IsOptional()
  @IsRegionCode()
  provinceCode?: string;

  @ApiPropertyOptional({ example: '110100000000', type: String, description: 'City region code (12 digits)' })
  @IsOptional()
  @IsRegionCode()
  cityCode?: string;

  @ApiPropertyOptional({ example: '110101000000', type: String, description: 'District region code (12 digits)' })
  @IsOptional()
  @IsRegionCode()
  districtCode?: string;

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

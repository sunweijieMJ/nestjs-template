import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeTransformer } from '../../../common/transformers/sanitize.transformer';
import { IsRegionCode } from '../../../common/decorators/is-region-code.decorator';

/**
 * Check if all region codes are provided
 */
function hasAllRegionCodes(obj: CreateAddressDto): boolean {
  return Boolean(obj.provinceCode && obj.cityCode && obj.districtCode);
}

export class CreateAddressDto {
  @ApiProperty({ example: 'John Doe', type: String, description: '收件人姓名' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  @Transform(sanitizeTransformer)
  name: string;

  @ApiProperty({ example: '13800138000', type: String, description: '手机号码' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: 'phone must be a valid Chinese mobile number' })
  phone: string;

  @ApiPropertyOptional({
    example: '110000000000',
    type: String,
    description: '省份区划代码（12位），提供后自动填充省份名称',
  })
  @IsOptional()
  @IsRegionCode()
  provinceCode?: string;

  @ApiPropertyOptional({
    example: '110100000000',
    type: String,
    description: '城市区划代码（12位），提供后自动填充城市名称',
  })
  @IsOptional()
  @IsRegionCode()
  cityCode?: string;

  @ApiPropertyOptional({
    example: '110101000000',
    type: String,
    description: '区县区划代码（12位），提供后自动填充区县名称',
  })
  @IsOptional()
  @IsRegionCode()
  districtCode?: string;

  @ApiPropertyOptional({ example: '北京市', type: String, description: '省份名称（提供区划代码时可省略）' })
  @ValidateIf((obj: CreateAddressDto) => !hasAllRegionCodes(obj))
  @IsNotEmpty({ message: 'province is required when region codes are not provided' })
  @IsString()
  @MaxLength(50)
  @Transform(sanitizeTransformer)
  province?: string;

  @ApiPropertyOptional({ example: '北京市', type: String, description: '城市名称（提供区划代码时可省略）' })
  @ValidateIf((obj: CreateAddressDto) => !hasAllRegionCodes(obj))
  @IsNotEmpty({ message: 'city is required when region codes are not provided' })
  @IsString()
  @MaxLength(50)
  @Transform(sanitizeTransformer)
  city?: string;

  @ApiPropertyOptional({ example: '朝阳区', type: String, description: '区县名称（提供区划代码时可省略）' })
  @ValidateIf((obj: CreateAddressDto) => !hasAllRegionCodes(obj))
  @IsNotEmpty({ message: 'district is required when region codes are not provided' })
  @IsString()
  @MaxLength(50)
  @Transform(sanitizeTransformer)
  district?: string;

  @ApiProperty({ example: '建国路88号SOHO现代城', type: String })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  @Transform(sanitizeTransformer)
  address: string;

  @ApiPropertyOptional({ example: false, type: Boolean })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

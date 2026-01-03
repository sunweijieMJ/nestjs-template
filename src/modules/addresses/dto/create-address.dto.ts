import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeTransformer } from '../../../common/transformers/sanitize.transformer';

export class CreateAddressDto {
  @ApiProperty({ example: 'John Doe', type: String })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  @Transform(sanitizeTransformer)
  name: string;

  @ApiProperty({ example: '13800138000', type: String })
  @IsNotEmpty()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: 'phone must be a valid Chinese mobile number' })
  phone: string;

  @ApiProperty({ example: '北京市', type: String })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  @Transform(sanitizeTransformer)
  province: string;

  @ApiProperty({ example: '北京市', type: String })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  @Transform(sanitizeTransformer)
  city: string;

  @ApiProperty({ example: '朝阳区', type: String })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  @Transform(sanitizeTransformer)
  district: string;

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

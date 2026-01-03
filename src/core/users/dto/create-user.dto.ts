import {
  // decorators here
  Transform,
  Type,
} from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  // decorators here
  IsEmail,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  Matches,
  MaxLength,
  MinLength,
  Max,
  Min,
} from 'class-validator';
import { FileDto } from '../../../modules/files/dto/file.dto';
import { RoleDto } from '../../../common/enums/roles/role.dto';
import { StatusDto } from '../../../common/enums/statuses/status.dto';
import { lowerCaseTransformer } from '../../../common/transformers/lower-case.transformer';
import { sanitizeTransformer } from '../../../common/transformers/sanitize.transformer';

export class CreateUserDto {
  @ApiPropertyOptional({ example: 'test1@example.com', type: String })
  @Transform(lowerCaseTransformer)
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @MinLength(8)
  @MaxLength(128)
  password?: string;

  provider?: string;

  @ApiPropertyOptional({ example: 'John', type: String })
  @Transform(sanitizeTransformer)
  @IsOptional()
  @IsString()
  firstName?: string | null;

  @ApiPropertyOptional({ example: 'Doe', type: String })
  @Transform(sanitizeTransformer)
  @IsOptional()
  @IsString()
  lastName?: string | null;

  @ApiPropertyOptional({ example: '13800138000', type: String })
  @IsOptional()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: 'phone must be a valid Chinese mobile number' })
  phone?: string | null;

  @ApiPropertyOptional({ example: 'Johnny', type: String })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(sanitizeTransformer)
  nickname?: string | null;

  @ApiPropertyOptional({ example: 0, type: Number, description: '0: unknown, 1: male, 2: female' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  gender?: number | null;

  @ApiPropertyOptional({ example: '1990-01-01', type: String })
  @IsOptional()
  @IsDateString()
  birthday?: Date | null;

  @ApiPropertyOptional({ type: () => FileDto })
  @IsOptional()
  photo?: FileDto | null;

  @ApiPropertyOptional({ type: RoleDto })
  @IsOptional()
  @Type(() => RoleDto)
  role?: RoleDto | null;

  @ApiPropertyOptional({ type: StatusDto })
  @IsOptional()
  @Type(() => StatusDto)
  status?: StatusDto;

  @ApiPropertyOptional({ example: 'oXXXX', type: String })
  @IsOptional()
  @IsString()
  wechatOpenId?: string | null;

  @ApiPropertyOptional({ example: 'uXXXX', type: String })
  @IsOptional()
  @IsString()
  wechatUnionId?: string | null;
}

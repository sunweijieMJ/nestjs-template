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
  IsEnum,
  Matches,
  MaxLength,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { FileDto } from '../../../modules/files/dto/file.dto';
import { RoleDto } from '../../../common/enums/roles/role.dto';
import { StatusDto } from '../../../common/enums/statuses/status.dto';
import { lowerCaseTransformer } from '../../../common/transformers/lower-case.transformer';
import { sanitizeTransformer } from '../../../common/transformers/sanitize.transformer';
import { IsMd5Password } from '../../../common/validators/md5-password.validator';
import { md5PasswordTransformer } from '../../../common/transformers/md5-password.transformer';
import { AuthProvidersEnum } from '../../auth/auth-providers.enum';

export class CreateUserDto {
  @ApiPropertyOptional({ example: 'test1@example.com', type: String })
  @Transform(lowerCaseTransformer)
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({ description: '前端 MD5 后的密码（32 位十六进制）' })
  @Transform(md5PasswordTransformer)
  @IsOptional()
  @IsMd5Password()
  password?: string;

  @ApiPropertyOptional({ enum: AuthProvidersEnum, default: AuthProvidersEnum.email })
  @IsOptional()
  @IsEnum(AuthProvidersEnum)
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
  @ValidateNested()
  @Type(() => FileDto)
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

  @ApiPropertyOptional({ example: '074a1CcTG1LelxKe4xQC0zgNdId0nxi95b5lsNpazWYoCo5', type: String })
  @IsOptional()
  @IsString()
  alipayOpenId?: string | null;
}

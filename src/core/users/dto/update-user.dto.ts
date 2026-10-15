import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

import { Transform, Type } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { FileDto } from '../../../modules/files/dto/file.dto';
import { RoleDto } from '../../../common/enums/roles/role.dto';
import { StatusDto } from '../../../common/enums/statuses/status.dto';
import { lowerCaseTransformer } from '../../../common/transformers/lower-case.transformer';
import { sanitizeTransformer } from '../../../common/transformers/sanitize.transformer';
import { IsMd5Password } from '../../../common/validators/md5-password.validator';
import { md5PasswordTransformer } from '../../../common/transformers/md5-password.transformer';
import { AuthProvidersEnum } from '../../auth/auth-providers.enum';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ example: 'test1@example.com', type: String })
  @Transform(lowerCaseTransformer)
  @IsOptional()
  @IsEmail()
  override email?: string | null;

  @ApiPropertyOptional({ description: '前端 MD5 后的密码（32 位十六进制）' })
  @Transform(md5PasswordTransformer)
  @IsOptional()
  @IsMd5Password()
  override password?: string;

  @ApiPropertyOptional({ enum: AuthProvidersEnum })
  @IsOptional()
  @IsEnum(AuthProvidersEnum)
  override provider?: string;

  @ApiPropertyOptional({ example: 'John', type: String })
  @Transform(sanitizeTransformer)
  @IsOptional()
  override firstName?: string | null;

  @ApiPropertyOptional({ example: 'Doe', type: String })
  @Transform(sanitizeTransformer)
  @IsOptional()
  override lastName?: string | null;

  @ApiPropertyOptional({ type: () => FileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FileDto)
  override photo?: FileDto | null;

  @ApiPropertyOptional({ type: () => RoleDto })
  @IsOptional()
  @Type(() => RoleDto)
  override role?: RoleDto | null;

  @ApiPropertyOptional({ type: () => StatusDto })
  @IsOptional()
  @Type(() => StatusDto)
  override status?: StatusDto;
}

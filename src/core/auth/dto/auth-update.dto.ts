import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, MaxLength, IsInt, Min, Max, IsDateString } from 'class-validator';
import { FileDto } from '../../../modules/files/dto/file.dto';
import { Transform, Type } from 'class-transformer';
import { lowerCaseTransformer } from '../../../common/transformers/lower-case.transformer';
import { IsMd5Password } from '../../../common/validators/md5-password.validator';
import { sanitizeTransformer } from '../../../common/transformers/sanitize.transformer';

export class AuthUpdateDto {
  @ApiPropertyOptional({ type: () => FileDto })
  @IsOptional()
  photo?: FileDto | null;

  @ApiPropertyOptional({ example: 'John' })
  @Transform(sanitizeTransformer)
  @IsOptional()
  @IsNotEmpty({ message: 'mustBeNotEmpty' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @Transform(sanitizeTransformer)
  @IsOptional()
  @IsNotEmpty({ message: 'mustBeNotEmpty' })
  lastName?: string;

  @ApiPropertyOptional({ example: 'Johnny' })
  @Transform(sanitizeTransformer)
  @IsOptional()
  @IsNotEmpty({ message: 'mustBeNotEmpty' })
  @MaxLength(50)
  nickname?: string;

  @ApiPropertyOptional({
    example: 0,
    description: '0: unknown, 1: male, 2: female',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2)
  gender?: number;

  @ApiPropertyOptional({ example: '1990-01-01', type: String })
  @IsOptional()
  @IsDateString()
  birthday?: Date | null;

  @ApiPropertyOptional({ example: 'new.email@example.com' })
  @IsOptional()
  @IsNotEmpty()
  @IsEmail()
  @Transform(lowerCaseTransformer)
  email?: string;

  @ApiPropertyOptional({ example: '5f4dcc3b5aa765d61d8327deb882cf99', description: 'MD5 encrypted new password' })
  @IsOptional()
  @IsNotEmpty()
  @IsMd5Password()
  password?: string;

  @ApiPropertyOptional({ example: '5f4dcc3b5aa765d61d8327deb882cf99', description: 'MD5 encrypted old password' })
  @IsOptional()
  @IsNotEmpty({ message: 'mustBeNotEmpty' })
  @IsMd5Password()
  oldPassword?: string;
}

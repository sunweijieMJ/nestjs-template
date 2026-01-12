import { Exclude, Expose, Transform } from 'class-transformer';
import { FileType } from '../../../modules/files/domain/file';
import { Role } from '../../../common/enums/roles/role';
import { Status } from '../../../common/enums/statuses/status';
import { ApiProperty } from '@nestjs/swagger';

export class User {
  @ApiProperty({
    type: Number,
  })
  id: number;

  @ApiProperty({
    type: String,
    example: 'john.doe@example.com',
  })
  @Expose({ groups: ['me', 'admin'] })
  email: string | null;

  @Exclude({ toPlainOnly: true })
  password?: string;

  @ApiProperty({
    type: String,
    example: 'email',
  })
  @Expose({ groups: ['me', 'admin'] })
  provider: string;

  @ApiProperty({
    type: String,
    example: 'John',
  })
  firstName: string | null;

  @ApiProperty({
    type: String,
    example: 'Doe',
  })
  lastName: string | null;

  @ApiProperty({
    type: String,
    example: '13800138000',
  })
  @Expose({ groups: ['me', 'admin'] })
  phone: string | null;

  @ApiProperty({
    type: String,
    example: 'Johnny',
  })
  nickname: string | null;

  @ApiProperty({
    type: Number,
    example: 0,
    description: '0: unknown, 1: male, 2: female',
  })
  gender: number | null;

  @ApiProperty({
    type: String,
    example: '1990-01-01',
  })
  @Transform(
    ({ value }) => {
      if (!value) return null;
      const date = value instanceof Date ? value : new Date(value);
      return date.toISOString().split('T')[0];
    },
    { toPlainOnly: true },
  )
  birthday: Date | null;

  @ApiProperty({
    type: () => FileType,
  })
  photo?: FileType | null;

  @ApiProperty({
    type: () => Role,
  })
  role?: Role | null;

  @ApiProperty({
    type: () => Status,
  })
  status?: Status | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;

  @ApiProperty({
    type: String,
    example: 'oXXXX',
    description: 'WeChat OpenID',
  })
  @Expose({ groups: ['me', 'admin'] })
  wechatOpenId: string | null;

  @ApiProperty({
    type: String,
    example: 'uXXXX',
    description: 'WeChat UnionID',
  })
  @Expose({ groups: ['me', 'admin'] })
  wechatUnionId: string | null;
}

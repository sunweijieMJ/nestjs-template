import { ApiProperty } from '@nestjs/swagger';

export class Config {
  @ApiProperty({ type: String, example: 'app.theme' })
  key: string;

  @ApiProperty({ type: Object, example: { primaryColor: '#1890ff' } })
  value: Record<string, unknown>;

  @ApiProperty({ type: Boolean, example: true, description: '公开配置可被所有登录用户读取' })
  isPublic: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

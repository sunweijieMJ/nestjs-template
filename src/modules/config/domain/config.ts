import { ApiProperty } from '@nestjs/swagger';

export class Config {
  @ApiProperty({ type: String, example: 'app.theme' })
  key: string;

  @ApiProperty({ type: Object, example: { primaryColor: '#1890ff' } })
  value: Record<string, unknown>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

import { ApiProperty } from '@nestjs/swagger';
import databaseConfig from '../../database/config/database.config';
import { DatabaseConfig } from '../../database/config/database-config.type';

const idType = (databaseConfig() as DatabaseConfig).isDocumentDatabase ? String : Number;

export class Address {
  @ApiProperty({
    type: idType,
  })
  id: number | string;

  @ApiProperty({
    type: idType,
    description: 'User ID who owns this address',
  })
  userId: number | string;

  @ApiProperty({ example: 'John Doe', type: String })
  name: string;

  @ApiProperty({ example: '13800138000', type: String })
  phone: string;

  @ApiProperty({ example: '北京市', type: String })
  province: string;

  @ApiProperty({ example: '北京市', type: String })
  city: string;

  @ApiProperty({ example: '朝阳区', type: String })
  district: string;

  @ApiProperty({ example: '建国路88号SOHO现代城', type: String })
  address: string;

  @ApiProperty({ example: false, type: Boolean })
  isDefault: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}

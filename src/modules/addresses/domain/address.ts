import { ApiProperty } from '@nestjs/swagger';

export class Address {
  @ApiProperty({
    type: Number,
  })
  id: number;

  @ApiProperty({
    type: Number,
    description: 'User ID who owns this address',
  })
  userId: number;

  @ApiProperty({ example: 'John Doe', type: String })
  name: string;

  @ApiProperty({ example: '13800138000', type: String })
  phone: string;

  @ApiProperty({ example: '110000000000', type: String, required: false })
  provinceCode?: string | null;

  @ApiProperty({ example: '110100000000', type: String, required: false })
  cityCode?: string | null;

  @ApiProperty({ example: '110101000000', type: String, required: false })
  districtCode?: string | null;

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

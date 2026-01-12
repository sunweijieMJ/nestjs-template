import { ApiProperty } from '@nestjs/swagger';
import { IsRegionCode } from '../../../common/decorators/is-region-code.decorator';

export class ProvinceCodeParam {
  @ApiProperty({
    description: 'Province region code (12 digits)',
    example: '110000000000',
  })
  @IsRegionCode()
  provinceCode: string;
}

export class CityCodeParam {
  @ApiProperty({
    description: 'City region code (12 digits)',
    example: '110100000000',
  })
  @IsRegionCode()
  cityCode: string;
}

export class RegionCodeParam {
  @ApiProperty({
    description: 'Region code (12 digits)',
    example: '110101000000',
  })
  @IsRegionCode()
  code: string;
}

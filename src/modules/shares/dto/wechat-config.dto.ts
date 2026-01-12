import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';

export class WeChatConfigDto {
  @ApiProperty({
    example: 'https://example.com/share/abc12345',
    description: 'The URL of the page to share',
  })
  @IsUrl()
  @IsNotEmpty()
  url: string;
}

export class WeChatJsSdkConfigResponseDto {
  @ApiProperty({
    example: 'wx1234567890abcdef',
    description: 'WeChat App ID',
  })
  appId: string;

  @ApiProperty({
    example: '1609459200',
    description: 'Timestamp',
  })
  timestamp: string;

  @ApiProperty({
    example: 'abc123def456',
    description: 'Random string',
  })
  nonceStr: string;

  @ApiProperty({
    example: 'a1b2c3d4e5f6g7h8i9j0',
    description: 'Signature generated using SHA1',
  })
  signature: string;
}

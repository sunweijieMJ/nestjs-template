import { ApiProperty } from '@nestjs/swagger';

export class WechatJsapiPaymentResponseDto {
  @ApiProperty({ description: '时间戳（秒）', example: '1760400000' })
  timeStamp: string;

  @ApiProperty({ description: '随机字符串', example: '593BEC0C930BF1AFEB40B4A08C8FB242' })
  nonceStr: string;

  @ApiProperty({ description: '预支付交易会话标识', example: 'prepay_id=wx201410272009395522657a690389285100' })
  package: string;

  @ApiProperty({ description: '签名类型', example: 'RSA' })
  signType: string;

  @ApiProperty({ description: '签名' })
  paySign: string;
}

export class WechatAppPaymentResponseDto {
  @ApiProperty({ description: '应用 ID' })
  appid: string;

  @ApiProperty({ description: '商户号' })
  partnerid: string;

  @ApiProperty({ description: '预支付交易会话标识' })
  prepayid: string;

  @ApiProperty({ description: '扩展字段', example: 'Sign=WXPay' })
  package: string;

  @ApiProperty({ description: '随机字符串' })
  noncestr: string;

  @ApiProperty({ description: '时间戳（秒）' })
  timestamp: string;

  @ApiProperty({ description: '签名' })
  sign: string;
}

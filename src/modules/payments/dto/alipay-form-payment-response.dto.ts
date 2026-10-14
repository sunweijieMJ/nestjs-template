import { ApiProperty } from '@nestjs/swagger';

export class AlipayFormPaymentResponseDto {
  @ApiProperty({
    description: '支付宝支付表单 HTML，提交后跳转支付宝收银台',
    example:
      '<form id="alipaysubmit" name="alipaysubmit" action="https://openapi.alipay.com/gateway.do" method="POST">…</form>',
  })
  form: string;
}

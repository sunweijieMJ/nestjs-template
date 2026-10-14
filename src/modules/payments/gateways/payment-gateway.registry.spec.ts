import { PaymentGatewayRegistry } from './payment-gateway.registry';
import { WechatPaymentGateway } from './wechat-payment.gateway';
import { AlipayPaymentGateway } from './alipay-payment.gateway';
import { PaymentChannel } from '../../orders/domain/order';

describe('PaymentGatewayRegistry', () => {
  const wechat = { channel: PaymentChannel.WECHAT, closeTrade: jest.fn() } as unknown as WechatPaymentGateway;
  const alipay = { channel: PaymentChannel.ALIPAY, closeTrade: jest.fn() } as unknown as AlipayPaymentGateway;
  const registry = new PaymentGatewayRegistry(wechat, alipay);

  it('should return the gateway of the channel', () => {
    expect(registry.get(PaymentChannel.ALIPAY)).toBe(alipay);
  });

  it('should try every channel and swallow close failures', async () => {
    (wechat.closeTrade as jest.Mock).mockRejectedValue(new Error('ORDER_NOT_EXIST'));
    (alipay.closeTrade as jest.Mock).mockResolvedValue(undefined);

    await expect(registry.closeTrades('ORD1')).resolves.toBeUndefined();
    expect(wechat.closeTrade).toHaveBeenCalledWith('ORD1');
    expect(alipay.closeTrade).toHaveBeenCalledWith('ORD1');
  });
});

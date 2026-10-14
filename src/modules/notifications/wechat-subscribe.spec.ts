import { buildSubscribeMessage, WechatSubscribeScene } from './wechat-subscribe';

describe('buildSubscribeMessage', () => {
  const payload = {
    scene: WechatSubscribeScene.ORDER_PAID,
    values: { orderNo: 'ORD1', amount: '99.00元', paidAt: '2026年10月14日 15:01' },
    page: 'pages-sub/order/detail/index?id=1',
  };

  it('should map business fields to the configured template keys', () => {
    expect(
      buildSubscribeMessage(payload, {
        templateId: 'TPL1',
        fields: { orderNo: 'character_string1', amount: 'amount2' },
      }),
    ).toEqual({
      templateId: 'TPL1',
      page: 'pages-sub/order/detail/index?id=1',
      data: { character_string1: 'ORD1', amount2: '99.00元' },
    });
  });

  it('should return null when the template is not configured', () => {
    expect(buildSubscribeMessage(payload, { templateId: '', fields: {} })).toBeNull();
    expect(buildSubscribeMessage(payload, undefined)).toBeNull();
  });
});

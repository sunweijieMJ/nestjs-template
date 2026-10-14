import { formatSubscribeAmount, formatSubscribeTime, formatSubscribeValue } from './subscribe-value.util';

describe('subscribe-value.util', () => {
  it('should truncate values by the field type prefix', () => {
    expect(formatSubscribeValue('thing1', '一二三四五六七八九十一二三四五六七八九十多余')).toBe(
      '一二三四五六七八九十一二三四五六七八九十',
    );
    expect(formatSubscribeValue('phrase2', '已支付成功啦')).toBe('已支付成功');
    expect(formatSubscribeValue('character_string3', 'A'.repeat(40))).toHaveLength(32);
  });

  it('should keep values of types without a length limit', () => {
    expect(formatSubscribeValue('amount1', '99.00元')).toBe('99.00元');
  });

  it('should format cents as yuan with two decimals', () => {
    expect(formatSubscribeAmount(9900)).toBe('99.00元');
    expect(formatSubscribeAmount(1)).toBe('0.01元');
  });

  it('should format time in Beijing time', () => {
    expect(formatSubscribeTime(new Date('2026-10-14T07:01:00Z'))).toBe('2026年10月14日 15:01');
  });
});

/** 订阅消息各字段类型的长度上限，按模板字段 key 的前缀匹配 */
const FIELD_MAX_LENGTH: [prefix: string, maxLength: number][] = [
  ['character_string', 32],
  ['car_number', 8],
  ['thing', 20],
  ['number', 32],
  ['letter', 32],
  ['symbol', 5],
  ['phrase', 5],
  ['name', 10],
];

/**
 * 按模板字段类型截断取值，超长会导致微信返回 47003
 * @param key - 模板字段 key，如 thing1、character_string2
 */
export function formatSubscribeValue(key: string, value: string): string {
  const rule = FIELD_MAX_LENGTH.find(([prefix]) => key.startsWith(prefix));
  return rule ? Array.from(value).slice(0, rule[1]).join('') : value;
}

/** 金额（分）转为订阅消息 amount 字段格式，如 99.00元 */
export function formatSubscribeAmount(cents: number): string {
  return `${(cents / 100).toFixed(2)}元`;
}

/** 时间转为订阅消息 time 字段格式（北京时间），如 2026年10月14日 15:01 */
export function formatSubscribeTime(date: Date): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}年${parts.month}月${parts.day}日 ${parts.hour}:${parts.minute}`;
}

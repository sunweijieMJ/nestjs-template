/** 分转元，保留两位小数 */
export function fenToYuan(fen: number): string {
  return (fen / 100).toFixed(2);
}

/** 元（最多两位小数的字符串）转分 */
export function yuanToFen(yuan: string): number {
  return Math.round(parseFloat(yuan) * 100);
}

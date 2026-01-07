import * as crypto from 'crypto';

/**
 * 格式化私钥（添加 PEM 格式头尾）
 */
export function formatPrivateKey(privateKey: string): string {
  if (privateKey.includes('BEGIN PRIVATE KEY')) {
    return privateKey;
  }
  return `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
}

/**
 * 格式化公钥（添加 PEM 格式头尾）
 */
export function formatPublicKey(publicKey: string): string {
  if (publicKey.includes('BEGIN PUBLIC KEY')) {
    return publicKey;
  }
  return `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
}

/**
 * 生成随机字符串
 */
export function generateNonceStr(length = 16): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * HTML 转义（防止 XSS）
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

import * as crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * 加密密码
 * @param password - 明文密码
 * @returns 加密后的密码哈希
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt();
  return bcrypt.hash(password, salt);
}

/**
 * 验证密码
 * @param plainPassword - 明文密码
 * @param hashedPassword - 加密后的密码哈希
 * @returns 密码是否匹配
 */
export async function comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

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

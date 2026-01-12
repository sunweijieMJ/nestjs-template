import * as crypto from 'crypto';

/**
 * Generate WeChat JS-SDK signature
 * @param jsapiTicket - WeChat jsapi_ticket
 * @param nonceStr - Random string
 * @param timestamp - Timestamp
 * @param url - Page URL (must match exactly)
 * @returns SHA1 signature
 */
export function generateWeChatSignature(jsapiTicket: string, nonceStr: string, timestamp: string, url: string): string {
  // Sort parameters alphabetically and concatenate
  const string = `jsapi_ticket=${jsapiTicket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;

  // Generate SHA1 hash
  const signature = crypto.createHash('sha1').update(string).digest('hex');

  return signature;
}

/**
 * Generate random string for WeChat signature
 * @param length - Length of random string (default: 16)
 * @returns Random alphanumeric string
 */
export function generateNonceStr(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

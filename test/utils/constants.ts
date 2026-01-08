import crypto from 'crypto';

/**
 * Helper function to convert password to MD5 hash
 * This is needed because the API now expects MD5-hashed passwords
 */
export function md5(password: string): string {
  return crypto.createHash('md5').update(password).digest('hex');
}

export const APP_URL = `http://localhost:${process.env.APP_PORT}`;
export const TESTER_EMAIL = 'john.doe@example.com';
export const TESTER_PASSWORD = md5('Secret00');
export const ADMIN_EMAIL = 'admin@example.com';
export const ADMIN_PASSWORD = md5('Secret00');
export const MAIL_HOST = process.env.MAIL_HOST;
export const MAIL_PORT = process.env.MAIL_CLIENT_PORT;

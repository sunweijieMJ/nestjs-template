import * as crypto from 'crypto';

/**
 * Generate a unique 8-character share code
 * Uses alphanumeric characters (excluding similar-looking characters)
 */
export function generateShareCode(): string {
  // Exclude similar-looking characters: 0, O, I, l, 1
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const length = 8;

  let result = '';
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    result += alphabet[randomBytes[i] % alphabet.length];
  }

  return result;
}

/**
 * Utility functions for sanitizing sensitive data in logs
 */

/**
 * Mask an email address for logging purposes
 * Example: "john.doe@example.com" -> "jo***@example.com"
 */
export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '[invalid]';
  }

  const atIndex = email.indexOf('@');
  if (atIndex <= 0) {
    return '[invalid]';
  }

  const localPart = email.substring(0, atIndex);
  const domain = email.substring(atIndex);

  if (localPart.length <= 2) {
    return `${localPart[0]}***${domain}`;
  }

  return `${localPart.substring(0, 2)}***${domain}`;
}

/**
 * Mask a phone number for logging purposes
 * Example: "13812345678" -> "138****5678"
 */
export function maskPhone(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return '[invalid]';
  }

  if (phone.length < 7) {
    return '***';
  }

  const prefix = phone.substring(0, 3);
  const suffix = phone.substring(phone.length - 4);

  return `${prefix}****${suffix}`;
}

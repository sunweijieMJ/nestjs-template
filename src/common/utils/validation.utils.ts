/**
 * 通用验证工具函数
 */

import { throwValidationError } from './exceptions.util';

/**
 * 验证邮箱是否已存在
 * @param existingUser - 查询到的已存在用户
 * @param currentUserId - 当前用户ID（更新时使用，创建时传 null）
 * @throws 如果邮箱已被其他用户使用则抛出验证错误
 */
export function validateEmailUniqueness(
  existingUser: { id: string | number } | null,
  currentUserId?: string | number | null,
): void {
  if (!existingUser) {
    return;
  }

  // 如果是更新操作且邮箱属于当前用户，则允许
  if (currentUserId && existingUser.id === currentUserId) {
    return;
  }

  throwValidationError('email', 'emailAlreadyExists');
}

/**
 * 验证手机号是否已存在
 * @param existingUser - 查询到的已存在用户
 * @param currentUserId - 当前用户ID（更新时使用，创建时传 null）
 * @throws 如果手机号已被其他用户使用则抛出验证错误
 */
export function validatePhoneUniqueness(
  existingUser: { id: string | number } | null,
  currentUserId?: string | number | null,
): void {
  if (!existingUser) {
    return;
  }

  // 如果是更新操作且手机号属于当前用户，则允许
  if (currentUserId && existingUser.id === currentUserId) {
    return;
  }

  throwValidationError('phone', 'phoneAlreadyExists');
}

import { StatusEnum } from '../enums/statuses/statuses.enum';

/**
 * Check if a status ID represents an active status
 */
export function isStatusActive(statusId: number | undefined): boolean {
  if (statusId === undefined) return false;
  return statusId === StatusEnum.active;
}

/**
 * Check if a status ID represents an inactive status
 */
export function isStatusInactive(statusId: number | undefined): boolean {
  if (statusId === undefined) return false;
  return statusId === StatusEnum.inactive;
}

/**
 * Check if a user status is allowed for login/authentication
 *
 * 业务规则说明：
 * - active (1): 已激活用户，允许登录
 * - inactive (2): 新注册用户（邮箱未确认），也允许登录
 *
 * 设计原因：允许未确认邮箱的用户登录，但他们的功能可能受限。
 * 如需强制邮箱验证后才能登录，请修改此函数只允许 active 状态。
 *
 * @param statusId - 用户状态 ID
 * @returns 是否允许登录
 */
export function isUserStatusAllowedForAuth(statusId: number | undefined): boolean {
  return isStatusActive(statusId) || isStatusInactive(statusId);
}

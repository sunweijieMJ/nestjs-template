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
 * Allows both active and inactive (newly registered, not yet confirmed email)
 */
export function isUserStatusAllowedForAuth(statusId: number | undefined): boolean {
  return isStatusActive(statusId) || isStatusInactive(statusId);
}

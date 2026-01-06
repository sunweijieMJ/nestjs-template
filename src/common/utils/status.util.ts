import { StatusEnum } from '../enums/statuses/statuses.enum';

/**
 * Check if a status ID represents an active status
 * Handles both number (PostgreSQL) and string (MongoDB) ID types
 */
export function isStatusActive(statusId: number | string | undefined): boolean {
  if (statusId === undefined) return false;
  return String(statusId) === String(StatusEnum.active);
}

/**
 * Check if a status ID represents an inactive status
 * Handles both number (PostgreSQL) and string (MongoDB) ID types
 */
export function isStatusInactive(statusId: number | string | undefined): boolean {
  if (statusId === undefined) return false;
  return String(statusId) === String(StatusEnum.inactive);
}

/**
 * Check if a user status is allowed for login/authentication
 * Allows both active and inactive (newly registered, not yet confirmed email)
 */
export function isUserStatusAllowedForAuth(statusId: number | string | undefined): boolean {
  return isStatusActive(statusId) || isStatusInactive(statusId);
}

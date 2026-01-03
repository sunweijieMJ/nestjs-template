/**
 * Permission enum defining all available permissions in the system.
 * Permissions follow the pattern: resource:action
 */
export enum Permission {
  // User Management
  USER_READ = 'user:read',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_LIST = 'user:list',

  // Address Management
  ADDRESS_READ = 'address:read',
  ADDRESS_CREATE = 'address:create',
  ADDRESS_UPDATE = 'address:update',
  ADDRESS_DELETE = 'address:delete',

  // Favorite Management
  FAVORITE_READ = 'favorite:read',
  FAVORITE_CREATE = 'favorite:create',
  FAVORITE_DELETE = 'favorite:delete',

  // Feedback Management
  FEEDBACK_READ = 'feedback:read',
  FEEDBACK_CREATE = 'feedback:create',
  FEEDBACK_LIST = 'feedback:list',

  // File Management
  FILE_UPLOAD = 'file:upload',
  FILE_READ = 'file:read',
  FILE_DELETE = 'file:delete',

  // Session Management
  SESSION_READ = 'session:read',
  SESSION_DELETE = 'session:delete',

  // System Management (Admin only)
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_METRICS = 'system:metrics',

  // Audit Log (Admin only)
  AUDIT_READ = 'audit:read',
  AUDIT_LIST = 'audit:list',
}

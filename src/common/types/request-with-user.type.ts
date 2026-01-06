import { Request } from 'express';
import { JwtPayloadType } from '../../core/auth/strategies/types/jwt-payload.type';
import { JwtRefreshPayloadType } from '../../core/auth/strategies/types/jwt-refresh-payload.type';

/**
 * Express Request with authenticated user (JWT payload)
 */
export interface RequestWithUser extends Request {
  user: JwtPayloadType;
}

/**
 * Express Request with refresh token user payload
 */
export interface RequestWithRefreshUser extends Request {
  user: JwtRefreshPayloadType;
}

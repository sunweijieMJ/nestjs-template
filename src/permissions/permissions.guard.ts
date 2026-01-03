import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from './permission.enum';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { RolePermissions } from './role-permissions';
import { RoleEnum } from '../roles/roles.enum';

interface RequestUser {
  id: string | number;
  role?: { id: RoleEnum };
}

/**
 * Guard that checks if the user has the required permissions.
 * Must be used after authentication (JwtAuthGuard).
 *
 * The guard checks the user's role and verifies if that role
 * has all the permissions specified by @RequirePermissions().
 *
 * @example
 * ```typescript
 * @Controller('users')
 * @UseGuards(AuthGuard('jwt'), PermissionsGuard)
 * export class UsersController {
 *   @Delete(':id')
 *   @RequirePermissions(Permission.USER_DELETE)
 *   async remove(@Param('id') id: number) {
 *     return this.usersService.remove(id);
 *   }
 * }
 * ```
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no permissions are required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestUser | undefined;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const roleId = user.role?.id;
    if (roleId === undefined) {
      throw new ForbiddenException('User role not found');
    }

    const userPermissions = RolePermissions[roleId] ?? [];

    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasAllPermissions) {
      const missingPermissions = requiredPermissions.filter(
        (permission) => !userPermissions.includes(permission),
      );
      throw new ForbiddenException(`Missing permissions: ${missingPermissions.join(', ')}`);
    }

    return true;
  }
}

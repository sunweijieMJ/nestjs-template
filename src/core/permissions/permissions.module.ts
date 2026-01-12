import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsGuard } from './permissions.guard';
import { PermissionsService } from './permissions.service';
import { PermissionEntity } from './infrastructure/persistence/permission.entity';
import { RolePermissionEntity } from './infrastructure/persistence/role-permission.entity';
import { PermissionRepository } from './infrastructure/persistence/permission.repository';

/**
 * PermissionsModule provides fine-grained permission control for the application.
 *
 * Features:
 * - Permission-based access control via @RequirePermissions() decorator
 * - Database-backed role-to-permission mapping with caching
 * - Backward compatible with hardcoded permissions if database is empty
 * - Works alongside existing @Roles() decorator for role-based access
 *
 * Usage:
 * 1. Add PermissionsGuard to your controller or route
 * 2. Use @RequirePermissions() to specify required permissions
 *
 * @example
 * Basic usage:
 * ```typescript
 * @Controller('users')
 * @UseGuards(AuthGuard('jwt'), PermissionsGuard)
 * export class UsersController {
 *   @Get()
 *   @RequirePermissions(Permission.USER_LIST)
 *   findAll() {
 *     return this.usersService.findAll();
 *   }
 *
 *   @Delete(':id')
 *   @RequirePermissions(Permission.USER_DELETE)
 *   remove(@Param('id') id: number) {
 *     return this.usersService.remove(id);
 *   }
 * }
 * ```
 *
 * @example
 * With existing Roles guard:
 * ```typescript
 * @Controller('admin/users')
 * @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
 * @Roles(RoleEnum.admin)
 * export class AdminUsersController {
 *   @Put(':id/role')
 *   @RequirePermissions(Permission.PERMISSION_CHANGE)
 *   updateRole(@Param('id') id: number, @Body() dto: UpdateRoleDto) {
 *     return this.usersService.updateRole(id, dto);
 *   }
 * }
 * ```
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([PermissionEntity, RolePermissionEntity])],
  providers: [PermissionsGuard, PermissionsService, PermissionRepository],
  exports: [PermissionsGuard, PermissionsService],
})
export class PermissionsModule {}

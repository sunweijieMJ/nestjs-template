import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { RoleEnum } from './roles.enum';

@Roles(RoleEnum.admin)
class AdminController {
  @Roles(RoleEnum.user)
  userRoute(): void {}

  adminRoute(): void {}
}

class OpenController {
  route(): void {}
}

function context(controller: new () => object, handler: string, roleId?: number): ExecutionContext {
  return {
    getClass: () => controller,
    getHandler: () => (controller.prototype as Record<string, unknown>)[handler],
    switchToHttp: () => ({ getRequest: () => ({ user: roleId === undefined ? undefined : { role: { id: roleId } } }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  it('should allow the request when no roles are declared', () => {
    expect(guard.canActivate(context(OpenController, 'route'))).toBe(true);
  });

  it('should apply the class roles when the handler declares none', () => {
    expect(guard.canActivate(context(AdminController, 'adminRoute', RoleEnum.admin))).toBe(true);
    expect(guard.canActivate(context(AdminController, 'adminRoute', RoleEnum.user))).toBe(false);
  });

  it('should let the handler roles override the class roles', () => {
    expect(guard.canActivate(context(AdminController, 'userRoute', RoleEnum.user))).toBe(true);
  });
});

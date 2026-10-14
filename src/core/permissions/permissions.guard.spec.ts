import type { Mock } from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { PermissionsService } from './permissions.service';
import { RequirePermissions } from './permissions.decorator';
import { Permission } from './permission.enum';
import { UsersController } from '../users/users.controller';
import { WechatPayController } from '../../modules/payments/wechat-pay.controller';
import { AlipayController } from '../../modules/payments/alipay.controller';
import { AppConfigController } from '../../modules/config/config.controller';
import { PERMISSIONS_KEY } from './permissions.decorator';

class TestController {
  @RequirePermissions(Permission.USER_LIST)
  list(): void {}

  open(): void {}
}

function context(handler: string, roleId?: number): ExecutionContext {
  return {
    getClass: () => TestController,
    getHandler: () => (TestController.prototype as unknown as Record<string, unknown>)[handler],
    switchToHttp: () => ({ getRequest: () => ({ user: { id: 1, role: roleId ? { id: roleId } : undefined } }) }),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  const permissionsService = {
    getPermissionsForRole: vi.fn().mockResolvedValue([Permission.USER_LIST]),
  } as unknown as PermissionsService;
  const guard = new PermissionsGuard(new Reflector(), permissionsService);

  it('should allow a role holding the required permission', async () => {
    await expect(guard.canActivate(context('list', 1))).resolves.toBe(true);
  });

  it('should reject a role missing the required permission', async () => {
    (permissionsService.getPermissionsForRole as Mock).mockResolvedValueOnce([]);
    await expect(guard.canActivate(context('list', 2))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should reject a guarded route that declares no permission', async () => {
    await expect(guard.canActivate(context('open', 1))).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('admin endpoints', () => {
  const required = (target: object, method: string): unknown =>
    Reflect.getMetadata(PERMISSIONS_KEY, (target as Record<string, object>)[method]);

  it.each([
    ['UsersController.create', UsersController.prototype, 'create', Permission.USER_CREATE],
    ['UsersController.findAll', UsersController.prototype, 'findAll', Permission.USER_LIST],
    ['UsersController.findOne', UsersController.prototype, 'findOne', Permission.USER_READ],
    ['UsersController.update', UsersController.prototype, 'update', Permission.USER_UPDATE],
    ['UsersController.remove', UsersController.prototype, 'remove', Permission.USER_DELETE],
    ['WechatPayController.refund', WechatPayController.prototype, 'refund', Permission.PAYMENT_REFUND],
    ['AlipayController.refund', AlipayController.prototype, 'refund', Permission.PAYMENT_REFUND],
    ['AppConfigController.upsert', AppConfigController.prototype, 'upsert', Permission.SYSTEM_CONFIG],
  ])('should require a permission on %s', (_label, target, method, permission) => {
    expect(required(target, method)).toEqual([permission]);
  });
});

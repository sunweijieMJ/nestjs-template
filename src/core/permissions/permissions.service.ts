import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PermissionRepository } from './infrastructure/persistence/permission.repository';
import { Permission } from './permission.enum';
import { RoleEnum } from '../../common/enums/roles/roles.enum';
import { RolePermissions as DefaultRolePermissions } from './role-permissions';

const CACHE_KEY_PREFIX = 'permissions:';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class PermissionsService implements OnModuleInit {
  private readonly logger = new Logger(PermissionsService.name);
  private rolePermissionsCache: Map<number, string[]> = new Map();
  private cacheLoaded = false;

  constructor(
    private readonly permissionRepository: PermissionRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.loadAllRolePermissions();
  }

  /**
   * 加载所有角色权限到内存缓存
   */
  async loadAllRolePermissions(): Promise<void> {
    try {
      const permissionMap = await this.permissionRepository.findAllRolePermissions();

      if (permissionMap.size === 0) {
        // 如果数据库为空，使用默认的硬编码配置（向后兼容）
        this.logger.warn('No permissions found in database, using default configuration');
        this.rolePermissionsCache = this.getDefaultPermissions();
      } else {
        this.rolePermissionsCache = permissionMap;
        this.logger.log(`Loaded permissions for ${permissionMap.size} roles from database`);
      }

      this.cacheLoaded = true;
    } catch (error) {
      this.logger.error('Failed to load permissions from database, falling back to defaults', error);
      this.rolePermissionsCache = this.getDefaultPermissions();
      this.cacheLoaded = true;
    }
  }

  /**
   * 获取默认的权限配置（向后兼容）
   */
  private getDefaultPermissions(): Map<number, string[]> {
    const map = new Map<number, string[]>();
    for (const [roleId, permissions] of Object.entries(DefaultRolePermissions)) {
      map.set(Number(roleId), permissions);
    }
    return map;
  }

  /**
   * 获取角色的权限列表
   */
  async getPermissionsForRole(roleId: RoleEnum): Promise<string[]> {
    // 首先检查内存缓存
    if (this.cacheLoaded && this.rolePermissionsCache.has(roleId)) {
      return this.rolePermissionsCache.get(roleId) || [];
    }

    // 如果内存缓存未加载，检查Redis缓存
    const cacheKey = `${CACHE_KEY_PREFIX}role:${roleId}`;
    const cached = await this.cacheManager.get<string[]>(cacheKey);
    if (cached) {
      this.rolePermissionsCache.set(roleId, cached);
      return cached;
    }

    // 从数据库加载
    const permissions = await this.permissionRepository.findPermissionIdsByRoleId(roleId);

    // 如果数据库为空，使用默认配置
    if (permissions.length === 0) {
      const defaultPermissions = DefaultRolePermissions[roleId] || [];
      this.rolePermissionsCache.set(roleId, defaultPermissions);
      return defaultPermissions;
    }

    // 更新缓存
    this.rolePermissionsCache.set(roleId, permissions);
    await this.cacheManager.set(cacheKey, permissions, CACHE_TTL_MS);

    return permissions;
  }

  /**
   * 检查角色是否有指定权限
   */
  async hasPermission(roleId: RoleEnum, permission: Permission): Promise<boolean> {
    const permissions = await this.getPermissionsForRole(roleId);
    return permissions.includes(permission);
  }

  /**
   * 检查角色是否有所有指定权限
   */
  async hasAllPermissions(roleId: RoleEnum, requiredPermissions: Permission[]): Promise<boolean> {
    const permissions = await this.getPermissionsForRole(roleId);
    return requiredPermissions.every((p) => permissions.includes(p));
  }

  /**
   * 设置角色权限
   */
  async setRolePermissions(roleId: RoleEnum, permissionIds: string[]): Promise<void> {
    await this.permissionRepository.setRolePermissions(roleId, permissionIds);
    await this.invalidateRoleCache(roleId);
  }

  /**
   * 为角色添加权限
   */
  async addPermissionToRole(roleId: RoleEnum, permissionId: string): Promise<void> {
    await this.permissionRepository.addPermissionToRole(roleId, permissionId);
    await this.invalidateRoleCache(roleId);
  }

  /**
   * 从角色移除权限
   */
  async removePermissionFromRole(roleId: RoleEnum, permissionId: string): Promise<void> {
    await this.permissionRepository.removePermissionFromRole(roleId, permissionId);
    await this.invalidateRoleCache(roleId);
  }

  /**
   * 使角色缓存失效
   */
  private async invalidateRoleCache(roleId: RoleEnum): Promise<void> {
    this.rolePermissionsCache.delete(roleId);
    await this.cacheManager.del(`${CACHE_KEY_PREFIX}role:${roleId}`);
    this.logger.debug(`Cache invalidated for role: ${roleId}`);
  }

  /**
   * 刷新所有权限缓存
   * 使用原子性替换避免竞态条件
   */
  async refreshCache(): Promise<void> {
    // 先加载新数据到临时变量
    const newCache = new Map<number, string[]>();

    try {
      const permissionMap = await this.permissionRepository.findAllRolePermissions();

      if (permissionMap.size === 0) {
        // 如果数据库为空，使用默认的硬编码配置
        for (const [roleId, permissions] of Object.entries(DefaultRolePermissions)) {
          newCache.set(Number(roleId), permissions);
        }
      } else {
        for (const [roleId, permissions] of permissionMap) {
          newCache.set(roleId, permissions);
        }
      }

      // 清除所有角色的Redis缓存
      for (const roleId of Object.values(RoleEnum)) {
        if (typeof roleId === 'number') {
          await this.cacheManager.del(`${CACHE_KEY_PREFIX}role:${roleId}`);
        }
      }

      // 原子性替换内存缓存引用
      this.rolePermissionsCache = newCache;
      this.logger.log('Permission cache refreshed');
    } catch (error) {
      this.logger.error('Failed to refresh permission cache', error);
      throw error;
    }
  }

  /**
   * 获取所有权限
   */
  async getAllPermissions(): Promise<{ id: string; name: string; description?: string }[]> {
    const permissions = await this.permissionRepository.findAll();
    if (permissions.length === 0) {
      // 返回枚举中的默认权限
      return Object.values(Permission).map((p) => ({
        id: p,
        name: p,
        description: undefined,
      }));
    }
    return permissions.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
    }));
  }
}

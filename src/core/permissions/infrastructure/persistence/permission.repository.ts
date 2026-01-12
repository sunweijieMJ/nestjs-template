import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionEntity } from './permission.entity';
import { RolePermissionEntity } from './role-permission.entity';

@Injectable()
export class PermissionRepository {
  constructor(
    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>,
    @InjectRepository(RolePermissionEntity)
    private readonly rolePermissionRepository: Repository<RolePermissionEntity>,
  ) {}

  /**
   * 获取所有权限
   */
  async findAll(): Promise<PermissionEntity[]> {
    return this.permissionRepository.find({
      order: { resource: 'ASC', action: 'ASC' },
    });
  }

  /**
   * 根据ID获取权限
   */
  async findById(id: string): Promise<PermissionEntity | null> {
    return this.permissionRepository.findOne({ where: { id } });
  }

  /**
   * 获取角色的所有权限ID
   */
  async findPermissionIdsByRoleId(roleId: number): Promise<string[]> {
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { roleId },
      select: ['permissionId'],
    });
    return rolePermissions.map((rp) => rp.permissionId);
  }

  /**
   * 获取所有角色的权限映射
   */
  async findAllRolePermissions(): Promise<Map<number, string[]>> {
    const rolePermissions = await this.rolePermissionRepository.find({
      select: ['roleId', 'permissionId'],
    });

    const permissionMap = new Map<number, string[]>();
    for (const rp of rolePermissions) {
      if (!permissionMap.has(rp.roleId)) {
        permissionMap.set(rp.roleId, []);
      }
      permissionMap.get(rp.roleId)!.push(rp.permissionId);
    }
    return permissionMap;
  }

  /**
   * 为角色设置权限
   */
  async setRolePermissions(roleId: number, permissionIds: string[]): Promise<void> {
    // 删除现有权限
    await this.rolePermissionRepository.delete({ roleId });

    // 添加新权限
    if (permissionIds.length > 0) {
      const rolePermissions = permissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      }));
      await this.rolePermissionRepository.insert(rolePermissions);
    }
  }

  /**
   * 为角色添加权限
   */
  async addPermissionToRole(roleId: number, permissionId: string): Promise<void> {
    await this.rolePermissionRepository.insert({ roleId, permissionId });
  }

  /**
   * 从角色移除权限
   */
  async removePermissionFromRole(roleId: number, permissionId: string): Promise<void> {
    await this.rolePermissionRepository.delete({ roleId, permissionId });
  }

  /**
   * 创建权限
   */
  async create(data: Partial<PermissionEntity>): Promise<PermissionEntity> {
    const entity = this.permissionRepository.create(data);
    return this.permissionRepository.save(entity);
  }

  /**
   * 批量创建权限
   */
  async createMany(data: Partial<PermissionEntity>[]): Promise<void> {
    await this.permissionRepository.insert(data);
  }

  /**
   * 检查权限是否存在
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.permissionRepository.count({ where: { id } });
    return count > 0;
  }
}

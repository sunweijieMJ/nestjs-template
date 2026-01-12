import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionSeedService } from './permission-seed.service';
import { PermissionEntity } from '../../../../../core/permissions/infrastructure/persistence/permission.entity';
import { RolePermissionEntity } from '../../../../../core/permissions/infrastructure/persistence/role-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PermissionEntity, RolePermissionEntity])],
  providers: [PermissionSeedService],
  exports: [PermissionSeedService],
})
export class PermissionSeedModule {}

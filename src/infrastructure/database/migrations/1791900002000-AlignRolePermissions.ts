import { MigrationInterface, QueryRunner } from 'typeorm';

/** 与 RoleEnum 一致 */
const ADMIN_ROLE_ID = 1;
const USER_ROLE_ID = 2;

export class AlignRolePermissions1791900002000 implements MigrationInterface {
  name = 'AlignRolePermissions1791900002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "permission" ("id", "name", "description", "resource", "action")
       SELECT 'payment:refund', 'Refund Payment', 'Refund paid orders', 'payment', 'refund'
       WHERE EXISTS (SELECT 1 FROM "permission")
       ON CONFLICT ("id") DO NOTHING`,
    );
    await queryRunner.query(
      `INSERT INTO "role_permission" ("role_id", "permission_id")
       SELECT $1, 'payment:refund'
       WHERE EXISTS (SELECT 1 FROM "role_permission")
       ON CONFLICT DO NOTHING`,
      [ADMIN_ROLE_ID],
    );
    await queryRunner.query(
      `DELETE FROM "role_permission" WHERE "role_id" = $1 AND "permission_id" IN ('user:read', 'user:update')`,
      [USER_ROLE_ID],
    );
  }

  /** 普通用户的 user:read / user:update 不恢复：新代码下它们会放开管理端用户接口 */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "role_permission" WHERE "permission_id" = 'payment:refund'`);
    await queryRunner.query(`DELETE FROM "permission" WHERE "id" = 'payment:refund'`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReleaseDeletedUserUniqueFields1741000000000 implements MigrationInterface {
  name = 'ReleaseDeletedUserUniqueFields1741000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "user"
      SET "email" = NULL, "phone" = NULL, "wechatOpenId" = NULL, "wechatUnionId" = NULL
      WHERE "deletedAt" IS NOT NULL
    `);
  }

  public async down(): Promise<void> {
    // 清空的数据无法恢复
  }
}

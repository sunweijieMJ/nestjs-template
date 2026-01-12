import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOptimizationIndexes1736000000000 implements MigrationInterface {
  name = 'AddOptimizationIndexes1736000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Composite index for favorite queries (userId + targetType)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_favorite_userId_targetType" ON "favorite" ("userId", "targetType")`,
    );

    // Composite index for address sorting (userId + isDefault + createdAt)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_address_userId_isDefault_createdAt" ON "address" ("userId", "isDefault" DESC, "createdAt" DESC)`,
    );

    // Soft delete indexes for better query performance
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_deletedAt" ON "user" ("deletedAt") WHERE "deletedAt" IS NULL`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_address_deletedAt" ON "address" ("deletedAt") WHERE "deletedAt" IS NULL`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_session_deletedAt" ON "session" ("deletedAt") WHERE "deletedAt" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_session_deletedAt"`);
    await queryRunner.query(`DROP INDEX "IDX_address_deletedAt"`);
    await queryRunner.query(`DROP INDEX "IDX_user_deletedAt"`);
    await queryRunner.query(`DROP INDEX "IDX_address_userId_isDefault_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_favorite_userId_targetType"`);
  }
}

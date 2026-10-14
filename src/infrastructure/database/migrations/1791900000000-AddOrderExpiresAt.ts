import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderExpiresAt1791900000000 implements MigrationInterface {
  name = 'AddOrderExpiresAt1791900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP`);
    await queryRunner.query(
      `UPDATE "order" SET "expiresAt" = "createdAt" + INTERVAL '30 minutes' WHERE "status" = 'UNPAID' AND "expiresAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_order_status_expiresAt" ON "order" ("status", "expiresAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_order_status_expiresAt"`);
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "expiresAt"`);
  }
}

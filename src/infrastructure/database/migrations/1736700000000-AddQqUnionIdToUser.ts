import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQqUnionIdToUser1736700000000 implements MigrationInterface {
  name = 'AddQqUnionIdToUser1736700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'qqUnionId') THEN
          ALTER TABLE "user" ADD "qqUnionId" character varying;
        END IF;
      END $$;
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_user_qqUnionId" ON "user" ("qqUnionId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_qqUnionId"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "qqUnionId"`);
  }
}

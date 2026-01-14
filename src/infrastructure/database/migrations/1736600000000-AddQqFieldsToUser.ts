import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQqFieldsToUser1736600000000 implements MigrationInterface {
  name = 'AddQqFieldsToUser1736600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'qqOpenId') THEN
          ALTER TABLE "user" ADD "qqOpenId" character varying UNIQUE;
        END IF;
      END $$;
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_user_qqOpenId" ON "user" ("qqOpenId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_qqOpenId"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "qqOpenId"`);
  }
}

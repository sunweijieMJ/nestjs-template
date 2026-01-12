import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhoneFieldsToUser1734000000000 implements MigrationInterface {
  name = 'AddPhoneFieldsToUser1734000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add columns if they don't exist
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'phone') THEN
          ALTER TABLE "user" ADD COLUMN "phone" character varying UNIQUE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'nickname') THEN
          ALTER TABLE "user" ADD COLUMN "nickname" character varying;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'gender') THEN
          ALTER TABLE "user" ADD COLUMN "gender" integer DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'birthday') THEN
          ALTER TABLE "user" ADD COLUMN "birthday" DATE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_user_phone" ON "user" ("phone")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_user_phone"`);
    await queryRunner.query(`
      ALTER TABLE "user"
      DROP COLUMN "birthday",
      DROP COLUMN "gender",
      DROP COLUMN "nickname",
      DROP COLUMN "phone"
    `);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhoneFieldsToUser1734000000000 implements MigrationInterface {
  name = 'AddPhoneFieldsToUser1734000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD COLUMN "phone" character varying UNIQUE,
      ADD COLUMN "nickname" character varying,
      ADD COLUMN "gender" integer DEFAULT 0,
      ADD COLUMN "birthday" DATE
    `);

    await queryRunner.query(`CREATE INDEX "IDX_user_phone" ON "user" ("phone")`);
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

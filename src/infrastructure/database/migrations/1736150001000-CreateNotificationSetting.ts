import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationSetting1736150001000 implements MigrationInterface {
  name = 'CreateNotificationSetting1736150001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_setting" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "category" character varying(20) NOT NULL,
        "enableInApp" boolean NOT NULL DEFAULT true,
        "enableEmail" boolean NOT NULL DEFAULT true,
        "enableSms" boolean NOT NULL DEFAULT true,
        "enablePush" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_setting_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_notification_setting_userId_category" UNIQUE ("userId", "category")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notification_setting_userId" ON "notification_setting" ("userId")`,
    );

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_notification_setting_user') THEN
          ALTER TABLE "notification_setting"
          ADD CONSTRAINT "FK_notification_setting_user"
          FOREIGN KEY ("userId")
          REFERENCES "user"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "notification_setting" DROP CONSTRAINT "FK_notification_setting_user"`);
    await queryRunner.query(`DROP INDEX "IDX_notification_setting_userId"`);
    await queryRunner.query(`DROP TABLE "notification_setting"`);
  }
}

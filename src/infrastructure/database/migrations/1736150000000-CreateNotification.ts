import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotification1736150000000 implements MigrationInterface {
  name = 'CreateNotification1736150000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "type" character varying(20) NOT NULL,
        "category" character varying(20) NOT NULL,
        "title" character varying(200) NOT NULL,
        "content" text NOT NULL,
        "metadata" jsonb,
        "channels" jsonb NOT NULL DEFAULT '[]',
        "sentChannels" jsonb NOT NULL DEFAULT '{}',
        "isRead" boolean NOT NULL DEFAULT false,
        "readAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_notification_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notification_userId" ON "notification" ("userId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notification_category" ON "notification" ("category")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notification_isRead" ON "notification" ("isRead")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notification_createdAt" ON "notification" ("createdAt")`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_notification_user') THEN
          ALTER TABLE "notification"
          ADD CONSTRAINT "FK_notification_user"
          FOREIGN KEY ("userId")
          REFERENCES "user"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_notification_user"`);
    await queryRunner.query(`DROP INDEX "IDX_notification_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_notification_isRead"`);
    await queryRunner.query(`DROP INDEX "IDX_notification_category"`);
    await queryRunner.query(`DROP INDEX "IDX_notification_userId"`);
    await queryRunner.query(`DROP TABLE "notification"`);
  }
}

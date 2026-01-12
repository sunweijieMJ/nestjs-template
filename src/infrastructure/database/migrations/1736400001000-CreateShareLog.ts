import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateShareLog1736400001000 implements MigrationInterface {
  name = 'CreateShareLog1736400001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "share_log" (
        "id" SERIAL NOT NULL,
        "shareId" integer NOT NULL,
        "action" character varying(20) NOT NULL,
        "visitorIp" character varying(45),
        "userAgent" text,
        "platform" character varying(20),
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_share_log_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_share_log_shareId" ON "share_log" ("shareId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_share_log_action" ON "share_log" ("action")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_share_log_createdAt" ON "share_log" ("createdAt")`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_share_log_share') THEN
          ALTER TABLE "share_log"
          ADD CONSTRAINT "FK_share_log_share"
          FOREIGN KEY ("shareId")
          REFERENCES "share"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "share_log" DROP CONSTRAINT "FK_share_log_share"`);
    await queryRunner.query(`DROP INDEX "IDX_share_log_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_share_log_action"`);
    await queryRunner.query(`DROP INDEX "IDX_share_log_shareId"`);
    await queryRunner.query(`DROP TABLE "share_log"`);
  }
}

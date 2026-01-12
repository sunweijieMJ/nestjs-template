import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateShare1736400000000 implements MigrationInterface {
  name = 'CreateShare1736400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "share" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "shareCode" character varying(8) NOT NULL,
        "targetType" character varying(20) NOT NULL,
        "targetId" character varying(100) NOT NULL,
        "platform" character varying(20) NOT NULL,
        "title" character varying(200) NOT NULL,
        "description" text,
        "image" character varying(500),
        "url" character varying(1000) NOT NULL,
        "metadata" jsonb,
        "viewCount" integer NOT NULL DEFAULT 0,
        "clickCount" integer NOT NULL DEFAULT 0,
        "conversionCount" integer NOT NULL DEFAULT 0,
        "expiresAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_share_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_share_shareCode" UNIQUE ("shareCode")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_share_userId" ON "share" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_share_shareCode" ON "share" ("shareCode")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_share_targetType" ON "share" ("targetType")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_share_targetId" ON "share" ("targetId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_share_createdAt" ON "share" ("createdAt")
    `);

    await queryRunner.query(`
      ALTER TABLE "share"
      ADD CONSTRAINT "FK_share_user"
      FOREIGN KEY ("userId")
      REFERENCES "user"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "share" DROP CONSTRAINT "FK_share_user"`);
    await queryRunner.query(`DROP INDEX "IDX_share_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_share_targetId"`);
    await queryRunner.query(`DROP INDEX "IDX_share_targetType"`);
    await queryRunner.query(`DROP INDEX "IDX_share_shareCode"`);
    await queryRunner.query(`DROP INDEX "IDX_share_userId"`);
    await queryRunner.query(`DROP TABLE "share"`);
  }
}

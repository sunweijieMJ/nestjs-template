import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFeedback1734000003000 implements MigrationInterface {
  name = 'CreateFeedback1734000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "feedback" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "type" character varying(20) NOT NULL,
        "content" text NOT NULL,
        "images" text,
        "contact" character varying(100),
        "status" character varying(20) NOT NULL DEFAULT 'pending',
        "reply" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_feedback_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_feedback_userId" ON "feedback" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_feedback_type" ON "feedback" ("type")`);
    await queryRunner.query(`CREATE INDEX "IDX_feedback_status" ON "feedback" ("status")`);

    await queryRunner.query(`
      ALTER TABLE "feedback"
      ADD CONSTRAINT "FK_feedback_user"
      FOREIGN KEY ("userId")
      REFERENCES "user"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "feedback" DROP CONSTRAINT "FK_feedback_user"`);
    await queryRunner.query(`DROP INDEX "IDX_feedback_status"`);
    await queryRunner.query(`DROP INDEX "IDX_feedback_type"`);
    await queryRunner.query(`DROP INDEX "IDX_feedback_userId"`);
    await queryRunner.query(`DROP TABLE "feedback"`);
  }
}

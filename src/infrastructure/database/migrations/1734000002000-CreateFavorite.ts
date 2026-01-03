import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFavorite1734000002000 implements MigrationInterface {
  name = 'CreateFavorite1734000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "favorite" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "targetType" character varying(20) NOT NULL,
        "targetId" character varying(100) NOT NULL,
        "title" character varying(200),
        "image" character varying(500),
        "extra" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_favorite_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_favorite_user_target" UNIQUE ("userId", "targetType", "targetId")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_favorite_userId" ON "favorite" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_favorite_targetType" ON "favorite" ("targetType")`);
    await queryRunner.query(`CREATE INDEX "IDX_favorite_targetId" ON "favorite" ("targetId")`);

    await queryRunner.query(`
      ALTER TABLE "favorite"
      ADD CONSTRAINT "FK_favorite_user"
      FOREIGN KEY ("userId")
      REFERENCES "user"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "favorite" DROP CONSTRAINT "FK_favorite_user"`);
    await queryRunner.query(`DROP INDEX "IDX_favorite_targetId"`);
    await queryRunner.query(`DROP INDEX "IDX_favorite_targetType"`);
    await queryRunner.query(`DROP INDEX "IDX_favorite_userId"`);
    await queryRunner.query(`DROP TABLE "favorite"`);
  }
}

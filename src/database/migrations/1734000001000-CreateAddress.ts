import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAddress1734000001000 implements MigrationInterface {
  name = 'CreateAddress1734000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "address" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "name" character varying(50) NOT NULL,
        "phone" character varying(20) NOT NULL,
        "province" character varying(50) NOT NULL,
        "city" character varying(50) NOT NULL,
        "district" character varying(50) NOT NULL,
        "address" character varying(200) NOT NULL,
        "isDefault" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_address_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_address_userId" ON "address" ("userId")
    `);

    await queryRunner.query(`
      ALTER TABLE "address"
      ADD CONSTRAINT "FK_address_user"
      FOREIGN KEY ("userId")
      REFERENCES "user"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "address" DROP CONSTRAINT "FK_address_user"`);
    await queryRunner.query(`DROP INDEX "IDX_address_userId"`);
    await queryRunner.query(`DROP TABLE "address"`);
  }
}

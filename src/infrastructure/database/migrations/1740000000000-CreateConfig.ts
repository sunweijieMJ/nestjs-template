import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConfig1740000000000 implements MigrationInterface {
  name = 'CreateConfig1740000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "config" (
        "key" character varying(200) NOT NULL,
        "value" jsonb NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_config_key" PRIMARY KEY ("key")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "config"`);
  }
}

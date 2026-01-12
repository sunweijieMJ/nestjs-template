import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRegion1736700000000 implements MigrationInterface {
  name = 'CreateRegion1736700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "region" (
        "id" SERIAL NOT NULL,
        "code" character varying(12) NOT NULL,
        "name" character varying(50) NOT NULL,
        "level" integer NOT NULL,
        "parentCode" character varying(12),
        "sort" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_region_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_region_code" UNIQUE ("code")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_region_code" ON "region" ("code")`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_region_level" ON "region" ("level")`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_region_parentCode" ON "region" ("parentCode")`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_region_level_parentCode" ON "region" ("level", "parentCode")`,
    );

    await queryRunner.query(`COMMENT ON TABLE "region" IS 'Administrative division data (Province/City/District)'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_region_level_parentCode"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_region_parentCode"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_region_level"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_region_code"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "region"`);
  }
}

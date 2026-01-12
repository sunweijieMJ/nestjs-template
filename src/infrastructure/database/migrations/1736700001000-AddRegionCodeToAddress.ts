import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRegionCodeToAddress1736700001000 implements MigrationInterface {
  name = 'AddRegionCodeToAddress1736700001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new code fields to address table
    await queryRunner.query(`
      ALTER TABLE "address"
      ADD COLUMN IF NOT EXISTS "provinceCode" character varying(12),
      ADD COLUMN IF NOT EXISTS "cityCode" character varying(12),
      ADD COLUMN IF NOT EXISTS "districtCode" character varying(12)
    `);

    // Create indexes for better query performance
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_address_provinceCode" ON "address" ("provinceCode")`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_address_cityCode" ON "address" ("cityCode")`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_address_districtCode" ON "address" ("districtCode")`);

    await queryRunner.query(`COMMENT ON COLUMN "address"."provinceCode" IS 'Province region code'`);

    await queryRunner.query(`COMMENT ON COLUMN "address"."cityCode" IS 'City region code'`);

    await queryRunner.query(`COMMENT ON COLUMN "address"."districtCode" IS 'District region code'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_address_districtCode"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_address_cityCode"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_address_provinceCode"`);
    await queryRunner.query(`
      ALTER TABLE "address"
      DROP COLUMN IF EXISTS "districtCode",
      DROP COLUMN IF EXISTS "cityCode",
      DROP COLUMN IF EXISTS "provinceCode"
    `);
  }
}

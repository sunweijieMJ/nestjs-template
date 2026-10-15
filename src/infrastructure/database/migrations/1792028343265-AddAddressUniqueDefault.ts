import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAddressUniqueDefault1792028343265 implements MigrationInterface {
  name = 'AddAddressUniqueDefault1792028343265';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "address" SET "isDefault" = false
      WHERE "id" IN (
        SELECT "id" FROM (
          SELECT "id", ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "updatedAt" DESC, "id" DESC) AS "rank"
          FROM "address"
          WHERE "isDefault" AND "deletedAt" IS NULL
        ) AS "defaults"
        WHERE "rank" > 1
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_address_userId_default" ON "address" ("userId") WHERE "isDefault" AND "deletedAt" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_address_userId_default"`);
  }
}

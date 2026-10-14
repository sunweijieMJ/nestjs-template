import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropUserSocialId1791900001000 implements MigrationInterface {
  name = 'DropUserSocialId1791900001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(
      `SELECT count(*)::int AS count FROM "user" WHERE "socialId" IS NOT NULL`,
    );
    if (count > 0) {
      throw new Error(`user.socialId still holds ${count} values; migrate or back them up before dropping the column`);
    }

    await queryRunner.query(`DROP INDEX "public"."IDX_9bd2fe7a8e694dedc4ec2f666f"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "socialId"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "socialId" character varying`);
    await queryRunner.query(`CREATE INDEX "IDX_9bd2fe7a8e694dedc4ec2f666f" ON "user" ("socialId")`);
  }
}

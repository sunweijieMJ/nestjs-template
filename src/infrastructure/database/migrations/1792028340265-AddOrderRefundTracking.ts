import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderRefundTracking1792028340265 implements MigrationInterface {
  name = 'AddOrderRefundTracking1792028340265';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order" ADD "refundedAmount" integer NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "order" ADD "refundNos" character varying(64) array NOT NULL DEFAULT '{}'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "refundNos"`);
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "refundedAmount"`);
  }
}

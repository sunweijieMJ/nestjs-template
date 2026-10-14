import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAlipayOpenIdToUser1791974458450 implements MigrationInterface {
  name = 'AddAlipayOpenIdToUser1791974458450';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "alipayOpenId" character varying`);
    await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "user_alipayOpenId_key" UNIQUE ("alipayOpenId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "user_alipayOpenId_key"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "alipayOpenId"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWechatFieldsToUser1734000004000 implements MigrationInterface {
  name = 'AddWechatFieldsToUser1734000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "wechatOpenId" character varying UNIQUE`);
    await queryRunner.query(`ALTER TABLE "user" ADD "wechatUnionId" character varying`);
    await queryRunner.query(`CREATE INDEX "IDX_user_wechatOpenId" ON "user" ("wechatOpenId")`);
    await queryRunner.query(`CREATE INDEX "IDX_user_wechatUnionId" ON "user" ("wechatUnionId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_user_wechatUnionId"`);
    await queryRunner.query(`DROP INDEX "IDX_user_wechatOpenId"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "wechatUnionId"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "wechatOpenId"`);
  }
}

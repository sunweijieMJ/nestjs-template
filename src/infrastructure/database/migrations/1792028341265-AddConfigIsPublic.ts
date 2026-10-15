import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConfigIsPublic1792028341265 implements MigrationInterface {
  name = 'AddConfigIsPublic1792028341265';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "config" ADD "isPublic" boolean NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "config" DROP COLUMN "isPublic"`);
  }
}

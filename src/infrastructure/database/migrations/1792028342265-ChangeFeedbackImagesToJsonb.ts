import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeFeedbackImagesToJsonb1792028342265 implements MigrationInterface {
  name = 'ChangeFeedbackImagesToJsonb1792028342265';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "feedback" ALTER COLUMN "images" TYPE jsonb USING CASE WHEN "images" IS NULL OR "images" = '' THEN NULL ELSE to_jsonb(string_to_array("images", ',')) END`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "feedback" ADD "images_text" text`);
    await queryRunner.query(
      `UPDATE "feedback" SET "images_text" = array_to_string(ARRAY(SELECT jsonb_array_elements_text("images")), ',') WHERE "images" IS NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "feedback" DROP COLUMN "images"`);
    await queryRunner.query(`ALTER TABLE "feedback" RENAME COLUMN "images_text" TO "images"`);
  }
}

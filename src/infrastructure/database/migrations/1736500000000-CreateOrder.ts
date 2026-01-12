import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrder1736500000000 implements MigrationInterface {
  name = 'CreateOrder1736500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "order" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "orderNo" character varying(32) NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'UNPAID',
        "paymentChannel" character varying(20),
        "transactionId" character varying(64),
        "totalAmount" integer NOT NULL,
        "paidAmount" integer,
        "paidAt" TIMESTAMP,
        "refundedAt" TIMESTAMP,
        "closedAt" TIMESTAMP,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_order_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_order_orderNo" UNIQUE ("orderNo")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_order_userId" ON "order" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_order_orderNo" ON "order" ("orderNo")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_order_status" ON "order" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_order_createdAt" ON "order" ("createdAt")
    `);

    await queryRunner.query(`
      ALTER TABLE "order"
      ADD CONSTRAINT "FK_order_user"
      FOREIGN KEY ("userId")
      REFERENCES "user"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_order_user"`);
    await queryRunner.query(`DROP INDEX "IDX_order_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_order_status"`);
    await queryRunner.query(`DROP INDEX "IDX_order_orderNo"`);
    await queryRunner.query(`DROP INDEX "IDX_order_userId"`);
    await queryRunner.query(`DROP TABLE "order"`);
  }
}

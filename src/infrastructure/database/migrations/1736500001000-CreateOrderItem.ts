import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrderItem1736500001000 implements MigrationInterface {
  name = 'CreateOrderItem1736500001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "order_item" (
        "id" SERIAL NOT NULL,
        "orderId" integer NOT NULL,
        "productId" character varying(100) NOT NULL,
        "productName" character varying(200) NOT NULL,
        "productImage" character varying(500),
        "unitPrice" integer NOT NULL,
        "quantity" integer NOT NULL DEFAULT 1,
        "subtotal" integer NOT NULL,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_order_item_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_order_item_orderId" ON "order_item" ("orderId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_order_item_productId" ON "order_item" ("productId")
    `);

    await queryRunner.query(`
      ALTER TABLE "order_item"
      ADD CONSTRAINT "FK_order_item_order"
      FOREIGN KEY ("orderId")
      REFERENCES "order"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order_item" DROP CONSTRAINT "FK_order_item_order"`);
    await queryRunner.query(`DROP INDEX "IDX_order_item_productId"`);
    await queryRunner.query(`DROP INDEX "IDX_order_item_orderId"`);
    await queryRunner.query(`DROP TABLE "order_item"`);
  }
}

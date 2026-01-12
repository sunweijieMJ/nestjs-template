import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePermission1736600000000 implements MigrationInterface {
  name = 'CreatePermission1736600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create permission table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "permission" (
        "id" character varying(50) NOT NULL,
        "name" character varying(100) NOT NULL,
        "description" character varying(255),
        "resource" character varying(50) NOT NULL,
        "action" character varying(50) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_permission_id" PRIMARY KEY ("id")
      )
    `);

    // Create index on resource
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_PERMISSION_RESOURCE" ON "permission" ("resource")`);

    // Create role_permission join table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "role_permission" (
        "role_id" integer NOT NULL,
        "permission_id" character varying(50) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_role_permission" PRIMARY KEY ("role_id", "permission_id")
      )
    `);

    // Create foreign key to role table
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_ROLE_PERMISSION_ROLE') THEN
          ALTER TABLE "role_permission"
          ADD CONSTRAINT "FK_ROLE_PERMISSION_ROLE"
          FOREIGN KEY ("role_id")
          REFERENCES "role"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    // Create foreign key to permission table
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_ROLE_PERMISSION_PERMISSION') THEN
          ALTER TABLE "role_permission"
          ADD CONSTRAINT "FK_ROLE_PERMISSION_PERMISSION"
          FOREIGN KEY ("permission_id")
          REFERENCES "permission"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    // Create indexes for faster lookup
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ROLE_PERMISSION_ROLE" ON "role_permission" ("role_id")`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ROLE_PERMISSION_PERMISSION" ON "role_permission" ("permission_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ROLE_PERMISSION_PERMISSION"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ROLE_PERMISSION_ROLE"`);

    // Drop foreign keys
    await queryRunner.query(`ALTER TABLE "role_permission" DROP CONSTRAINT IF EXISTS "FK_ROLE_PERMISSION_PERMISSION"`);
    await queryRunner.query(`ALTER TABLE "role_permission" DROP CONSTRAINT IF EXISTS "FK_ROLE_PERMISSION_ROLE"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permission"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_PERMISSION_RESOURCE"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permission"`);
  }
}

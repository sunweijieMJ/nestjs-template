import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLog1735900000000 implements MigrationInterface {
  name = 'CreateAuditLog1735900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" SERIAL NOT NULL,
        "userId" character varying,
        "action" character varying(50) NOT NULL,
        "entityType" character varying(100) NOT NULL,
        "entityId" character varying NOT NULL,
        "oldValue" jsonb,
        "newValue" jsonb,
        "ipAddress" character varying,
        "userAgent" text,
        "requestId" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_logs_userId" ON "audit_logs" ("userId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_logs_action" ON "audit_logs" ("action")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_logs_entityType" ON "audit_logs" ("entityType")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_logs_entityId" ON "audit_logs" ("entityId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_logs_requestId" ON "audit_logs" ("requestId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_logs_createdAt" ON "audit_logs" ("createdAt")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_requestId"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_entityId"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_entityType"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_action"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_userId"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
  }
}

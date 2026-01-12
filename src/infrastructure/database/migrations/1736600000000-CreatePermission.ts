import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePermission1736600000000 implements MigrationInterface {
  name = 'CreatePermission1736600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create permission table
    await queryRunner.createTable(
      new Table({
        name: 'permission',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'resource',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'action',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create index on resource
    await queryRunner.createIndex(
      'permission',
      new TableIndex({
        name: 'IDX_PERMISSION_RESOURCE',
        columnNames: ['resource'],
      }),
    );

    // Create role_permission join table
    await queryRunner.createTable(
      new Table({
        name: 'role_permission',
        columns: [
          {
            name: 'role_id',
            type: 'int',
            isPrimary: true,
          },
          {
            name: 'permission_id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create foreign key to role table
    await queryRunner.createForeignKey(
      'role_permission',
      new TableForeignKey({
        columnNames: ['role_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'role',
        onDelete: 'CASCADE',
        name: 'FK_ROLE_PERMISSION_ROLE',
      }),
    );

    // Create foreign key to permission table
    await queryRunner.createForeignKey(
      'role_permission',
      new TableForeignKey({
        columnNames: ['permission_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'permission',
        onDelete: 'CASCADE',
        name: 'FK_ROLE_PERMISSION_PERMISSION',
      }),
    );

    // Create indexes for faster lookup
    await queryRunner.createIndex(
      'role_permission',
      new TableIndex({
        name: 'IDX_ROLE_PERMISSION_ROLE',
        columnNames: ['role_id'],
      }),
    );

    await queryRunner.createIndex(
      'role_permission',
      new TableIndex({
        name: 'IDX_ROLE_PERMISSION_PERMISSION',
        columnNames: ['permission_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('role_permission', 'IDX_ROLE_PERMISSION_PERMISSION');
    await queryRunner.dropIndex('role_permission', 'IDX_ROLE_PERMISSION_ROLE');

    // Drop foreign keys
    await queryRunner.dropForeignKey('role_permission', 'FK_ROLE_PERMISSION_PERMISSION');
    await queryRunner.dropForeignKey('role_permission', 'FK_ROLE_PERMISSION_ROLE');

    // Drop tables
    await queryRunner.dropTable('role_permission');
    await queryRunner.dropIndex('permission', 'IDX_PERMISSION_RESOURCE');
    await queryRunner.dropTable('permission');
  }
}

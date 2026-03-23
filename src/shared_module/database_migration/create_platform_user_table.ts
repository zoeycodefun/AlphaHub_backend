import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';
/**
 * create platform_user table for user management
 */
export class CreatePlatformUserTable1697600000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'platform_user',
                columns: [
                    { name: 'id', type: 'serial', isPrimary: true },
                    { name: 'username', type: 'varchar', length: '64', isNullable: false },
                    { name: 'password', type: 'varchar', length: '128', isNullable: false },
                    { name: 'email', type: 'varchar', length: '64', isNullable: true },
                    { name: 'phone', type: 'varchar', length: '32', isNullable: true },
                    { name: 'nickname', type: 'varchar', length: '64', isNullable: true },
                    { name: 'avatar', type: 'varchar', length: '256', isNullable: true },
                    { name: 'enabled', type: 'boolean', default: true },
                    { name: 'email_verified', type: 'boolean', default: false },
                    { name: 'phone_verified', type: 'boolean', default: false },
                    { name: 'role', type: 'varchar', length: '32', default: "'user'" },
                    { name: 'extra_info', type: 'jsonb', isNullable: true },
                    { name: 'created_at', type: 'timestamptz', default: 'NOW()' },
                    { name: 'updated_at', type: 'timestamptz', default: 'NOW()' },
                    { name: 'last_login_at', type: 'bigint', isNullable: true },
                ],
            }),
            true,
        );

        await queryRunner.createIndex(
            'platform_user',
            new TableIndex({
                name: 'idx_platform_user_username',
                columnNames: ['username'],
                isUnique: true,
            }),
        );
        await queryRunner.createIndex(
            'platform_user',
            new TableIndex({
                name: 'idx_platform_user_email',
                columnNames: ['email'],
                isUnique: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('platform_user', 'idx_platform_user_email');
        await queryRunner.dropIndex('platform_user', 'idx_platform_user_username');
        await queryRunner.dropTable('platform_user');
    }
}
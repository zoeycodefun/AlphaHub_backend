import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";
/**
 * database migration: create CEX accounts management table
 * make sure columns, index and table name are consistent with the entity definition in cex_account.entity.ts
 */
export class CreateCexAccountsTable1697100000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'cex_accounts_management',
                columns: [
                    { name: 'id', type: 'serial', isPrimary: true },
                    { name: 'user_id', type: 'varchar', length: '64', isNullable: false },
                    { name: 'exchange', type: 'varchar', length: '32', isNullable: false },
                    { name: 'exchange_display_name', type: 'varchar', length: '64', isNullable: false },
                    { name: 'account_type', type: 'varchar', length: '32', isNullable: false },
                    { name: 'account_environment', type: 'varchar', length: '16', isNullable: false },
                    { name: 'account_name', type: 'varchar', length: '128', isNullable: true },
                    { name: 'account_other_name', type: 'varchar', length: '128', isNullable: true },
                    { name: 'api_key_hash', type: 'varchar', length: '128', isNullable: false },
                    { name: 'encrypted_api_key', type: 'text', isNullable: false },
                    { name: 'encrypted_api_secret', type: 'text', isNullable: false },
                    { name: 'encrypted_api_passphrase', type: 'text', isNullable: true },
                    { name: 'permissions', type: 'varchar', isNullable: false, default: "'[]'" },
                    { name: 'can_trade', type: 'boolean', default: false },
                    { name: 'can_withdraw', type: 'boolean', default: false },
                    { name: 'can_transfer', type: 'boolean', default: false },
                    { name: 'status', type: 'varchar', length: '16', default: "'active'" },
                    { name: 'enabled', type: 'boolean', default: true },
                    { name: 'connection_status', type: 'varchar', length: '16', default: "'disconnected'" },
                    { name: 'health_status', type: 'varchar', length: '16', default: "'unknown'" },
                    { name: 'last_used_at', type: 'timestamptz', isNullable: true },
                    { name: 'usage_count', type: 'bigint', default: 0 },
                    { name: 'daily_usage_count', type: 'bigint', default: 0 },
                    { name: 'consecutive_failures', type: 'integer', default: 0 },
                    { name: 'last_error_at', type: 'timestamptz', isNullable: true },
                    { name: 'last_error_message', type: 'text', isNullable: true },
                    { name: 'configuration', type: 'jsonb', isNullable: true },
                    { name: 'exchange_config', type: 'jsonb', isNullable: true },
                    { name: 'created_at', type: 'timestamptz', default: 'NOW()' },
                    { name: 'updated_at', type: 'timestamptz', default: 'NOW()' },
                    { name: 'deleted_at', type: 'timestamptz', isNullable: true },
                
                ],
            }),
            true,
        );
        await queryRunner.createIndex(
            'cex_accounts_management',
            new TableIndex({
                name: 'uq_cex_user_exchange_type_env',
                columnNames: ['user_id', 'exchange', 'account_type', 'account_environment'],
                isUnique: true,
            }),
        );
        // query index
        await queryRunner.createIndex(
            'cex_accounts_management',
            new TableIndex({
                name: 'idx_cex_user_exchange',
                columnNames: ['user_id', 'exchange'],
            }),
        );
    }
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('cex_accounts_management', 'idx_cex_user_exchange');
        await queryRunner.dropIndex('cex_accounts_management', 'uq_cex_user_exchange_type_env');
        await queryRunner.dropTable('cex_accounts_management');
    }

}
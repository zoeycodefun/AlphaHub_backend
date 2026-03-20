import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";
/**
 * database migration: create DEX accounts management table
 * define the columns and index related to DexAccountManagementEntity
 */
export class CreateDexAccountsTable1697100001000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'dex_account_management',
                columns: [
                    { name: 'id', type: 'serial', isPrimary: true },
                    { name: 'user_id', type: 'varchar', length: '64', isNullable: false },
                    { name: 'chain_id', type: 'integer', isNullable: false },
                    { name: 'chain_name', type: 'varchar', length: '32', isNullable: false },
                    { name: 'chain_display_name', type: 'varchar', length: '64', isNullable: false },
                    { name: 'network_type', type: 'varchar', length: '16', default: "'mainnet'" },
                    { name: 'wallet_address', type: 'varchar', length: '128', isNullable: false },
                    { name: 'wallet_address_hash', type: 'varchar', length: '128', isNullable: false },
                    { name: 'public_key', type: 'text', isNullable: true },
                    { name: 'wallet_type', type: 'varchar', length: '32', isNullable: false },
                    { name: 'wallet_provider', type: 'varchar', length: '64', isNullable: false },
                    { name: 'wallet_client_version', type: 'varchar', length: '32', isNullable: true },
                    { name: 'dex_platform', type: 'varchar', length: '32', isNullable: true },
                    { name: 'dex_platform_version', type: 'varchar', length: '16', isNullable: true },
                    { name: 'permissions', type: 'varchar', isNullable: false, default: "'[]'" },
                    { name: 'can_trade', type: 'boolean', default: false },
                    { name: 'can_liquidate', type: 'boolean', default: false },
                    { name: 'can_stake', type: 'boolean', default: false },
                    { name: 'status', type: 'varchar', length: '16', default: "'active'" },
                    { name: 'enabled', type: 'boolean', default: true },
                    { name: 'connection_status', type: 'varchar', length: '16', default: "'disconnected'" },
                    { name: 'health_status', type: 'varchar', length: '16', default: "'unknown'" },
                    { name: 'last_used_at', type: 'timestamptz', isNullable: true },
                    { name: 'trade_count', type: 'bigint', default: 0 },
                    { name: 'successful_trade_count', type: 'bigint', default: 0 },
                    { name: 'failed_trade_count', type: 'bigint', default: 0 },
                    { name: 'consecutive_failed_trade_count', type: 'integer', default: 0 },
                    { name: 'last_failed_trade_at', type: 'timestamptz', isNullable: true },
                    { name: 'last_error_message', type: 'text', isNullable: true },
                    { name: 'last_error_code', type: 'varchar', length: '64', isNullable: true },
                    { name: 'balance_snapshot', type: 'jsonb', isNullable: true },
                    { name: 'last_balance_update_at', type: 'timestamptz', isNullable: true },
                    { name: 'gas_reference_type', type: 'varchar', length: '16', default: "'standard'" },
                    { name: 'gas_settings', type: 'jsonb', isNullable: true },
                    { name: 'created_at', type: 'timestamptz', default: 'NOW()' },
                    { name: 'updated_at', type: 'timestamptz', default: 'NOW()' },
                    { name: 'deleted_at', type: 'timestamptz', isNullable: true },
                ],
            }),
            true,
        );
        await queryRunner.createIndex(
            'dex_account_management',
            new TableIndex({
                name: 'uq_dex_user_chain_wallet',
                columnNames: ['user_id', 'chain_id', 'wallet_address'],
                isUnique: true,
            }),
        );
        // index
        await queryRunner.createIndex(
            'dex_account_management',
            new TableIndex({
                name: 'idx_dex_user_chain',
                columnNames: ['user_id', 'chain_id'],
            }),
        );
        await queryRunner.createIndex(
            'dex_account_management',
            new TableIndex({
                name: 'idx_dex_wallet_type_chain',
                columnNames: ['wallet_type', 'chain_id'],
            }),
        );
    }
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('dex_account_management', 'idx_dex_wallet_type_chain');
        await queryRunner.dropIndex('dex_account_management', 'idx_dex_user_chain');
        await queryRunner.dropIndex('dex_account_management', 'uq_dex_user_chain_wallet');
        await queryRunner.dropTable('dex_account_management');
    }
}



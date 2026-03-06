import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Check, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
/**
 * CEX account management table
 * store CEX platform users' CEX API account information, support multiple exchanges, accounts type, permissions management
 * functions: support multiple CEX exchanges API accounts management, sensitive information encryption and storage, users authentication management, audit, indexing for performance
 * design: only store API key, API secret(AES-256-GCM encryption), Passphrase, do not store account password and other sensitive information. Support users to manage their API accounts, and only interact with CEX through API key authentication
 * minimize permissions acqusition
 */
@Entity({ name: 'cex_account_management',
    comment: 'CEX accounts management table, store API accounts information of different CEX exchanges of users, support multiple accounts management, and permissions management'
})
@Unique(['userId', 'exchange', 'accountType', 'apiKeyHash'])
@Index('idx_cex_account_user_exchange', ['userId', 'exchange']) // for query performance, support query by user and exchange
@Index('idx_cex_account_exchange_type', ['exchange', 'accountType']) 
@Index('idx_cex_account_status_usage', ['enabled', 'lastUsedAt'])
@Index('idx_cex_account_created_at', ['createdAt'])
@Check(`"permissions" IS NOT NULL AND jsonb_array_length("permissions") > 0`)
@Check(`"api_key_hash" IS NOT NULL AND length("api_key_hash") > 0`)
@Check(`"consecutive_failures" >= 0`)
@Check(`"usage_count" >= 0 AND "daily_usage_count" >= 0`)

export class CexAccountManagementEntity {
    @ApiProperty({ description: 'account unique index', example: 1 })
    @PrimaryGeneratedColumn('increment', { comment: 'primary key, auto increment, globally unique' })
    id: number;
    
    @ApiProperty({ description: 'user id from platform', example: 'user_1' })
    @Column({ 
        type: 'varchar', 
        length: 64, 
        comment: 'user id from platform',
        collation: 'C'
    })
    userId: string;

    @ApiProperty({ description: 'exchanges name or index', example: 'binance' })
    @Column({ 
        type: 'varchar', 
        length: 32, 
        comment: 'exchange name, e.g. binance',
        collation: 'C'
    })
    exchange: string;

    @ApiProperty({ description: 'exchanges display name', example: 'Binance' })
    @Column({
        type: 'varchar',
        length: 64,
        comment: 'exchange display name, e.g. Binance',
        collation: 'C'
    })
    exchangeDisplayName: string;

    @ApiProperty({ description: 'account type', example: 'spot'})
    @Column({ 
        type: 'varchar',
        length: 16,
        comment: 'spot, futures',
        enum: ['spot', 'futures']
    })
    accountType: string;

    @ApiProperty({ description: 'account environment', example: 'live'})
    @Column({ 
        type: 'varchar', 
        length: 16, 
        comment: 'accounts environments, e.g. live, test, demo',
        enum: ['live', 'test', 'demo']
    })
    accountEnvironment: string;

    @ApiProperty({ description: 'custom account name', example: 'main trade account' })
    @Column({ 
        type: 'varchar', 
        length: 100, 
        comment: 'account name, different accounts, e.g. main account, sub account, strategy account, test account, etc.'})
    accountName: string;

    @ApiProperty({ description: 'other names of account', example: 'binance-main' })
    @Column({
        type: 'varchar',
        length: 50,
        nullable: true,
        comment: 'other account name, system generated or user defined, used for quick identification'
    })
    accountOtherName: string | null;

    @ApiProperty({ description: 'API key hash', example: 'sha256:...'})
    @Column({
        type: 'varchar',
        length: 128,
        comment: 'API key hash, for uniqueness verification and quick lookup, do not store raw API key',
        collation: 'C'
    })
    apiKeyHash: string;

    @Column({ 
        type: 'text', 
        comment: 'API key after AES-256-GCM encryption, including salt, IV and authentication tag, key rotation timely' 
    })
    encryptedApiKey: string;

    @Column({ 
        type: 'text',
        comment: 'API secret after AES-256-GCM encryption, including salt, IV and authentication tag' 
    })
    encryptedApiSecret: string;

    @Column({ 
        type: 'text',
        nullable: true,
        comment: 'API passphrase after AES-256-GCM encryption, optional' 
    })
    encryptedApiPassphrase: string | null;

    @ApiProperty({ description: 'account permissions configuration', example: '["read", "trade", "withdraw"]' })
    @Column({ 
        type: 'jsonb',
        comment: 'account permissions configuration, JSON array, e.g. ["trade", "read", "withdraw"]',
        default: '["read"]' 
    })
    permissions: string;

    @ApiProperty({ description: 'if allow trade', example: true })
    @Column({ 
        type: 'boolean',
        default: false,
        comment: 'whether allow trading, if false, only allow read-only access, for security management'
    })
    canTrade: boolean;
    
    @ApiProperty({ description: 'if allow withdrawal', example: false })
    @Column({
        type: 'boolean',
        default: false,
        comment: 'whether allow withdrawal, for security management, generally not recommended to enable'
    })
    canWithdraw: boolean;

    @ApiProperty({ description: 'if allow transfer', example: false })
    @Column({
        type: 'boolean',
        default: false,
        comment: 'whether allow transfer, for security management, generally not recommended to enable'
    })
    canTransfer: boolean;
    
    @ApiProperty({ description: 'account status', example: 'active' })
    @Column({ 
        type: 'varchar',
        length: 16,
        default: 'active',
        comment: 'account status, active, inactive, suspended, expired',
        enum: ['active', 'inactive', 'suspended', 'expired']
    })
    status: string;

    @ApiProperty({ description: 'if enable the account', example: true })
    @Column({
        type: 'boolean',
        default: true,
        comment: 'whether the account is enabled, if false, all operations related to this account are not allowed, for quick disable of compromised accounts'
    })
    enabled: boolean;

    @ApiProperty({ description: 'account health status', example: 'healthy' })
    @Column({
        type: 'varchar',
        length: 16,
        default: 'unknown',
        comment: 'account health status, healthy, warning, error, unknown',
        enum: ['healthy', 'warning', 'error', 'unknown']
    })
    healthStatus: string;

    @ApiProperty({ description: 'last used time', example: '2026-03-06T10:00:00Z' })
    @Column({
        type: 'timestamptz',
        nullable: true,
        comment: 'last used time, for counting and cleaning inactive accounts'
    })
    lastUsedAt: Date | null;

    @ApiProperty({ description: 'API used times count', example: 1500 })
    @Column({
        type: 'bigint',
        default: 0,
        comment: 'API used times count, for counting and rate limiting'
    })
    usageCount: number;

    @ApiProperty({ description: 'API used times count in last 24 hours', example: 45 })
    @Column({
        type: 'integer',
        default: 0,
        comment: 'API used times count in last 24 hours, for counting and rate limiting, reset at 0:00 UTC every day'
    })
    dailyUsageCount: number;
    
    @Column({
        type: 'date',
        nullable: true,
        comment: 'last used date'
    })
    lastUsedDate: Date | null;

    @ApiProperty({ description: 'continous error count', example: 0})
    @Column({
        type: 'integer',
        default: 0,
        comment: 'continous error count, for risk management, if exceed the threshold, ban the account automatically'
    })
    consecutiveFailures: number;

    @Column({
        type: 'timestamptz',
        nullable: true,
        comment: 'the last time when the API account error happened'
    })
    lastErrorAt: Date | null;

    @Column({
        type: 'text',
        nullable: true,
        comment: 'the error message of the last error happened, for risk management and debugging'
    })
    lastErrorMessage: string | null;

    @ApiProperty({ description: 'account configuration', example: '{"ratelimit": 1000, "timeout": 5000}' })
    @Column({ 
        type: 'jsonb', 
        nullable: true,
        comment: 'accounts configuration, in JSON format, e.g. fee limit, timeout settings, special parameters'
    })
    configuration: Record<string, any> | null;

    @Column({ 
        type: 'jsonb', 
        nullable: true,
        comment: 'specific configuration information of exchanges, in JSON format, e.g. API version, special endpoints, custom params'
    })
    exchangeConfig: Record<string, any> | null;

    @Column({ 
        type: 'jsonb', 
        nullable: true,
        comment: 'extra metadata'
    })
    metadata: Record<string, any> | null;
    
    @ApiProperty({ description: 'account created time', example: '2026-03-06T10:00:00Z' })
    @CreateDateColumn({ 
        type: 'timestamptz',
        comment: 'record creation time, manage automatically'
    })
    createdAt: Date;

    @ApiProperty({ description: 'last update time', example: '2026-03-06T10:30:00Z' })
    @UpdateDateColumn({ 
        type: 'timestamptz',
        comment: 'record last update time, manage automatically'
    })
    updatedAt: Date;

    @DeleteDateColumn({ 
        type: 'timestamptz',
        nullable: true,
        comment: 'timestamp of deleting, null is no delete, manage automatically'
    })
    deletedAt: Date | null;
}
/**
 * use userId+exchange+accountType+apiKey as unique index to ensure API account is unique for specific user and exchange
 * accountType supports real trade and simulated trade environment
 */
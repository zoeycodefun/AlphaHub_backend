import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Check, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
/**
 * DEX accounts management table
 * functions: support multiple chains wallets accounts management, integrate with DEX trading platforms, monitor wallet connection status, and manage authentication for DEX trading, including complete audit trail
 * store DEX platforms users' DEX wallets information, support multiple chains, wallets type, and authentication management
 * design: just store wallet sddress, public key and other insensitive information
 * try not to save secret key and manage users' assets, all operations related to users' assets should be done on client side, and only interact with blockchain through users' wallet signature verification 
 */
@Entity({ 
    name: 'dex_account_management',
    comment: 'DEX accounts management table, store wallet accounts information from all blockchains of users, support multiple chains wallet management and integration with DEX trading platforms'
 })
@Unique(['userId', 'chainId', 'walletAddress'])
@Index('idx_dex_account_user_chain', ['userId', 'chainId'])
@Index('idx_dex_account_wallet_type', ['walletType', 'chainId'])
@Index('idx_dex_account_status_usage', ['enabled', 'lastUsedAt'])
@Index('idx_dex_account_created_at', ['createdAt'])
@Check(`"wallet_address" IS NOT NULL AND length("wallet_address") >= 20`)
@Check(`"permissionc" IS NOT NULL AND jsonb_array_length("permissions") > 0`)
@Check(`"usage_count" >= 0`)
export class DexAccountManagementEntity {
    @ApiProperty({ description: 'unique identifier for each account', example: 1 })
    @PrimaryGeneratedColumn('increment', { 
        comment: 'primary key, auto increment' })
    id: number;

    @ApiProperty({ description: 'account user id', example: 'user_123' })
    @Column({ 
        type: 'varchar',
        length: 64,
        comment: 'unique identifier for each account user, support UUID or custom user ID format',
        collation: 'C'
    })
    userId: string;

    @ApiProperty({ description: 'blockchain website ID', example: 1 })
    @Column({
        type: 'integer',
        comment: 'blockchain website ID, e.g. 1 for ethereum, 56 for bsc, 137 for polygon, etc.'
    })
    chainId: number;

    @ApiProperty({ description: 'blockchain website name', example: 'ethereum' })
    @Column({
        type: 'varchar',
        length: 32,
        comment: 'blockchain weisite name, e.g. ethereum, bsc, polygon, arbitrum, etc.',
        collation: 'C'
    })
    chainName: string;

    @ApiProperty({ description: 'blockchain website display name', example: 'Ethereum' })
    @Column({
        type: 'varchar',
        length: 64,
        comment: 'blockchain website display name, e.g. Ethereum, Binance Smart Chain, Polygon'
    })
    chainDisplayName: string;

    @ApiProperty({ description: 'website type', example: 'mainnet' })
    @Column({
        type: 'varchar',
        length: 16,
        default: 'mainnet',
        comment: 'website type, e.g. mainnet, testnet, etc.',
        enum: ['mainnet', 'testnet']
    })
    networkType: string;

    @ApiProperty({ description: 'wallet address', example: '0x742...'})
    @Column({ 
        type: 'varchar',
        length: 128,
        comment: 'blockchain wallet address, support different wallet types and formats, e.g. Ethereum address, Solana address, etc.',
        collation: 'C'
    })
    walletAddress: string;

    @Column({
        type: 'varchar',
        length: 128,
        comment: 'hash value of wallet address, used for quick search and uniqueness verification, do not store raw wallet address and sensitive information',
        collation: 'C'
    })
    walletAddressHash: string;

    @ApiProperty({ description: 'wallet public key', example: '0x04...' })
    @Column({
        type: 'text',
        nullable: true,
        comment: 'wallet public key, used for signature verification and authentication, optional for some wallet types'
    })
    publicKey: string | null;

    @ApiProperty({ description: 'wallet type', example: 'metamask' })
    @Column({
        type: 'varchar',
        length: 32,
        comment: 'wallet type, e.g. metamask, trustwallet, coinbase wallet, phantom wallet, etc.',
        enum: ['metamask', 'okx', 'trustwallet', 'coinbasewallet', 'phantomwallet', 'other']
    })
    walletType: string;

    @ApiProperty({ description:'wallet providers', example: 'MetaMask' })
    @Column({
        type: 'varchar',
        length: 64,
        comment: 'wallet provider, e.g. MetaMask, OKX Wallet, Trust Wallet, Coinbase Wallet, Phantom Wallet, etc.'
    })
    walletProvider: string;

    @Column({
        type: 'varchar',
        length: 32,
        nullable: true,
        comment: 'wallet client version, optional, used for compatibility management and future troubleshooting'
    })
    walletClientVersion: string | null;

    @ApiProperty({ description: 'DEX platform', example: 'uniswap, hyperliquid, etc.' })
    @Column({
        type: 'varchar',
        length: 32,
        nullable: true,
        comment: 'DEX trading platform connected with the wallet, e.g. hyperliquid, uniswap, sushiswap, etc.',
        enum: ['hyperliquid', 'uniswap', 'sushiswap', 'pancakeswap', '1inch', 'other']
    })
    dexPlatform: string | null;

    @Column({
        type: 'varchar',
        length: 16,
        nullable: true,
        comment: 'DEX trading platform version, optional, used for compatibility management and future troubleshooting'
    })
    dexPlatformVersion: string | null;

    @ApiProperty({ description: 'accounts authentication configuration', example: '["read", "trade", "swap"]' })
    @Column({
        type: 'varchar',
        comment: 'accounts authentication configuration, stored as JSON array string, e.g. ["read", "swap", "trade"]',
        default: '["read"]'
    })
    permissions: string[];

    @ApiProperty({ description: 'whether allow trade', example: true })
    @Column({
        type: 'boolean',
        default: false,
        comment: 'whether allow trade, if false, only allow read-only authentication'
    })
    canTrade: boolean;

    @ApiProperty({ description: 'if allow liquidation', example: true })
    @Column({
        type: 'boolean',
        default: false,
        comment: 'whether allow liquidation'
    })
    canLiquidate: boolean;

    @ApiProperty({ description: 'if allow stake', example: false })
    @Column({
        type: 'boolean',
        default: false,
        comment: 'whether allow stake'
    })
    canStake: boolean;

    @ApiProperty({ description: 'account status', example: 'active' })
    @Column({
        type: 'varchar',
        length: 16,
        default: 'active',
        comment: 'account status, e.g. active, inactive, suspended, expited, etc.',
        enum: ['active', 'inactive', 'suspended', 'expired']
    })
    status: string;

    @ApiProperty({ description: 'if enable account', example: true })
    @Column({
        type: 'boolean',
        default: true,
        comment: 'whether the wallet account is enabled, if false, all operations related to this account will be terminated',
    })
    enabled: boolean;

    @ApiProperty({ description: 'the connection status of the wallet', example: 'connected' })
    @Column({
        type: 'varchar',
        length: 16,
        default: 'disconnected',
        comment: 'the connection status of the wallet, e.g. connected, disconnected, connecting, error',
        enum: ['connected', 'disconnected', 'connecting', 'error']
    })
    connectionStatus: string;

    @ApiProperty({ description: 'account health status', example: 'healthy' })
    @Column({
        type: 'varchar',
        length: 16,
        default: 'unknown',
        comment: 'account health status, e.g. healthy, warning, error, unknown',
        enum: ['healthy', 'warning', 'error', 'unknown']
    })
    healthStatus: string;

    @ApiProperty({ description: 'last used time of the account', example: '2024-01-01T00:00:00Z' })
    @Column({
        type: 'timestamptz',
        nullable: true,
        comment: 'the timestamp of the last time the account was used, used for account management and cleanup of inactive accounts'
    })
    lastUsedAt: Date | null;

    @ApiProperty({ description: 'trade count of the account', example: 1500 })
    @Column({
        type: 'bigint',
        default: 0,
        comment: 'the total trade count of the account, used for account management and monitoring'
    })
    tradeCount: number;

    @ApiProperty({ description: 'the amount of successful trades', example: 1450 })
    @Column({
        type: 'bigint',
        default: 0,
        comment: 'the amount of successful trades'
    })
    successfulTradeCount: number;

    @ApiProperty({ description: 'the amount of failed trades', example: 50 })
    @Column({
        type: 'bigint',
        default: 0,
        comment: 'the amount of failed trades'
    })
    failedTradeCount: number;
    
    @ApiProperty({ description: 'continuous failed trade count', example: 0 })
    @Column({
        type: 'integer',
        default: 0,
        comment: 'continuous failed trade count, used for circuit breaker mechanism, if the count exceeds a certain threshold, the account can be automatically suspended to prevent further losses'
    })
    consecutiveFailedTradeCount: number;

    @Column({
        type: 'varchar',
        default: 0,
        comment: 'the timestamp of the last failed trade'
    })
    lastFailedTradeAt: Date | null;

    @Column({
        type: 'text',
        nullable: true,
        comment: 'the error message of the last failed trade, used for troubleshooting and monitoring'
    })
    lastErrorMessage: string | null;

    @Column({
        type: 'varchar',
        length: 64,
        nullable: true,
        comment: 'the last trading error code'
    })
    lastErrorCode: string | null;

    @Column({
        type: 'jsonb',
        nullable: true,
        comment:'snapshot of the account balance, in JSON format, including all kinds of symbols balance, used for quick check'
    })
    balanceSnapshot: Record<string, any> | null;

    @Column({
        type: 'timestamptz',
        nullable: true,
        comment: 'the last time the balance was updated'
    })
    lastBalanceUpdateAt: Date | null;

    @Column({
        type: 'varchar',
        length: 16,
        default: 'standard',
        comment: 'gas refrence type, e.g. slow, standard, fast, instant',
        enum: ['slow', 'standard', 'fast', 'instant']
    })
    gasReferenceType: string;

    @Column({
        type: 'jsonb',
        nullable: true,
        comment: 'custom gas limitation settings, in JSON format, including gasLimit, gasPrice and other parameters'
    })
    gasSettings: Record<string, any> | null;

    @ApiProperty({ description: 'accounts configuration', example: '{"slippage": 0.5, "deadline": 300}' })
    @Column({
        type: 'jsonb',
        nullable: true,
        comment: 'accounts configuration, in JSON format, e.g. slippage settings, tansaction deadline settings, and auto approval, etc.'
    })
    configuration: Record<string, any> | null;

    @Column({
        type: 'jsonb',
        nullable: true,
        comment: 'specific configuration for DEX platforms, in JSON format, e.g. routers reference, liquidity source preference, etc.'
    })
    dexConfiguration: Record<string, any> | null;

    @Column({
        type: 'jsonb',
        nullable: true,
        comment: 'specific configuration for wallets, in JSON format, e.g. connection parameters, signature settings, etc.'
    })
    walletConfiguration: Record<string, any> | null;

    @ApiProperty({ description: 'account label', example: '["defi", "yield-farming"]' })
    @Column({ 
        type: 'jsonb', 
        nullable: true,
        comment: 'account label array, used for classification and search, e.g. ["DeFi", "Yield Farming", "Arbitrage"]'
    })
    tags: string[] | null;

    @Column({ 
        type: 'jsonb', 
        nullable: true,
        comment: 'extend metadata, used for future additional data, e.g. contract address.'
    })
    metadata: Record<string, any> | null;

    @ApiProperty({ description: 'creation time', example: '2026-03-06T10:00:00Z' })
    @CreateDateColumn({ 
        type: 'timestamptz',
        comment: 'record creation time, UTC timezone, automatically maintained'
    })
    createdAt: Date;

    @ApiProperty({ description: 'last update time', example: '2026-03-06T10:30:00Z' })
    @UpdateDateColumn({ 
        type: 'timestamptz',
        comment: 'record last update time, UTC timezone, automatically maintained'
    })
    updatedAt: Date;

    @DeleteDateColumn({ 
        type: 'timestamptz',
        nullable: true,
        comment: 'record deletion time, used for soft delete, UTC timezone, automatically maintained'
    })
    deletedAt: Date | null;
}

/**
 * use userId+chainType+walletAddress as unique index to ensure wallet address is unique for specific user and chain
 * walletType supports different wallet types, e.g. metamask, trust wallet, etc.
 * permissions support specific permission, e.g. read-only, trading permission, etc.
 * no sensitive information collected, and no management of users' assets, all operations related to users' assets should be done on client side, and only interact with blockchain through users' wallet signature verification
 */
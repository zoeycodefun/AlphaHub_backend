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
    



    @Column({ type: 'varchar', length: 32, comment: 'blockchain type, e.g. ethereum, bsc, polygon, etc.' })
    chainType: string;

    @Column({ type: 'varchar', length: 128, comment: 'wallet address' })
    walletAddress: string;

    @Column({ type: 'varchar', length: 128, nullable: true, comment: 'public key, optional for some wallet types' })
    publicKey: string | null;

    @Column({ type: 'varchar', length: 32, comment: 'wallet type, e.g. metamask, trust wallet, etc.' })
    walletType: string;

    @Column({ type: 'boolean', default: true, comment: 'whether the wallet is active, support users to manage their wallets' })
    enabled: boolean;

    @Column({ type: 'varchar', length: 32, comment: 'permissions, e.g. read, trade, etc. for future use' })
    permissions: string;

    @Column({ type: 'jsonb', nullable: true, comment: 'additional info, in the format of JSON, for future use' })
    extraInfo: Record<string, any> | null;

    @CreateDateColumn({ comment: 'record creation time' })
    createdAt: Date;
    
    @UpdateDateColumn({ comment: 'record update time' })
    updatedAt: Date;
}
/**
 * use userId+chainType+walletAddress as unique index to ensure wallet address is unique for specific user and chain
 * walletType supports different wallet types, e.g. metamask, trust wallet, etc.
 * permissions support specific permission, e.g. read-only, trading permission, etc.
 * no sensitive information collected, and no management of users' assets, all operations related to users' assets should be done on client side, and only interact with blockchain through users' wallet signature verification
 * ❌❌具体根据hyper liquid的连接要求和其他去中心化交易所的要求调整参数
 */
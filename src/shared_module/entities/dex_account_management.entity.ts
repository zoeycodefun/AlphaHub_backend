import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
/**
 * DEX accounts management table
 * store DEX platforms users' DEX wallets information, support multiple chains, wallets type, and authentication management
 * design: just store wallet sddress, public key and other insensitive information
 * try not to save secret key and manage users' assets, all operations related to users' assets should be done on client side, and only interact with blockchain through users' wallet signature verification 
 */
@Entity({ name: 'dex_account_management' })
@Index(['userId', 'chainType', 'walletAddress'], { unique: true }) // united unique index, ensures every wallet address is unique for specific user and chain
export class DexAccountManagementEntity {
    @PrimaryGeneratedColumn('increment', { comment: 'primary key, auto increment' })
    id: number;

    @Column({ type: 'varchar', length: 16, comment: 'account type, real_trade, or simulated_trade' })
    accountType: string;

    @Column({ type: 'varchar', length: 64, comment: 'user id from platform'})
    userId: string;

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
 * ❌❌具体根据hyper liquid的连接要求调整参数
 */
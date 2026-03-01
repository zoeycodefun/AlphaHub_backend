import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
/**
 * CEX account management table
 * store CEX platform users' CEX API account information, support multiple exchanges, accounts type, permissions management
 * design: only store API key, API secret, Passphrase, do not store account password and other sensitive information. Support users to manage their API accounts, and only interact with CEX through API key authentication
 * support multiple exchanges, users, accounts type
 * minimize permissions acqusition
 */
@Entity({ name: 'cex_account_management' })
@Index(['userId', 'exchange', 'accountType', 'apiKey'], { unique: true})
export class CexAccountManagementEntity {
    @PrimaryGeneratedColumn('increment', { comment: 'primary key, auto increment' })
    id: number;

    @Column({ type: 'varchar', length: 64, comment: 'user id from platform'})
    userId: string;

    @Column({ type: 'varchar', length: 32, comment: 'exchange name, e.g. binance' })
    exchange: string;

    @Column({ type: 'varchar', length:16, comment: 'account type, real_trade, or simulated_trade' })
    accountType: string;

    @Column({ type: 'varchar', length: 64, comment: 'account name, different accounts, e.g. main account, sub account, strategy account, test account, etc.'})
    accountName: string;

    @Column({ type: 'varchar', length: 128, comment: 'API key(encrypted store)' })
    apiKey: string;

    @Column({ type: 'varchar', length: 128, comment: 'API secret(encrypted store)' })
    apiSecret: string;

    @Column({ type: 'varchar', length: 128, nullable: true, comment: 'API Passphrase(encrypted store)'})
    apiPassphrase: string | null;

    @Column({ type: 'boolean', default: true, comment: 'whether the account is active'})
    enabled: boolean;

    @Column({ type: 'varchar', length: 32, comment: 'account permissions, e.g. trade, view, withdraw, etc.'})
    permissions: string;

    @Column({ type: 'jsonb', nullable: true, comment: 'extra info, in the format of JSON, for future use' })
    extraInfo: Record<string, any> | null;

    @CreateDateColumn({ comment: 'record creation time' })
    createdAt: Date;

    @UpdateDateColumn({ comment: 'record update time' })
    updatedAt: Date;

}
/**
 * use userId+exchange+accountType+apiKey as unique index to ensure API account is unique for specific user and exchange
 * accountType supports real trade and simulated trade environment
 * 
 * 
 */
// contract funding fee data table, store funding fee history data
import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
/**
 * contract funding fee data table
 * store every contract, every account's funding fee details, support the distinction of real trade and simulated trade
 */
@Entity({ name: 'contract_funding_fee' })
@Index(['trade_type', 'exchange', 'accountId', 'symbol', 'fundingTime'], { unique: true })
export class ContractFundingFeeEntity {
    @PrimaryGeneratedColumn('increment', { comment: 'primary key, auto increment' })
    id: number;

    @Column({ type: 'varchar', length: 8, comment: 'trade type, real or simulated' })
    tradeType: string;

    @Column({ type: 'varchar', length: 32, comment: 'exchange name, e.g. binance' })
    exchange: string;

    @Column({ type: 'varchar', length: 64, comment: 'account id from exchange' })
    accountId: string;
    
    @Column({ type: 'varchar', length: 64, comment: 'contract symbol, e.g. BTCUSDT' })
    symbol: string;

    @Column({ type: 'bigint', comment: 'funding time, timestamp in ms' })
    fundingTime: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'funding fee amount' })
    fundingFee: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'funding fee rate(%)' })
    fundingRate: string;

    @Column({ type: 'varchar', length: 16, comment: 'position side, long or short' })
    positionSide: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'position amount when funding fee generated' })
    positionAmount: string;

    @Column({ type: 'varchar', length: 16, comment: 'funding fee type, pay or receive' })
    payDirection: string;

    @CreateDateColumn({ comment: 'record creation time' })
    createdAt: Date;

    @UpdateDateColumn({ comment: 'record update time' })
    updatedAt: Date;
}

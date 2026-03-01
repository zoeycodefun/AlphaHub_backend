// contract fund flow data table
import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
/**
 * contract fund flow data table
 * store every account, every contract's fund flow details(in, out, transfer, funding fee, fee, realized PnL, etc.)
 */
@Entity({ name: 'contract_fund_flow' })
@Index(['trade_type', 'exchange', 'accountId', 'symbol', 'flowTime'], { unique: true })
export class ContractFundFlowEntity {
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

    @Column({ type: 'bigint', comment: 'fund flow time, timestamp in ms' })
    flowTime: string;

    @Column({ type: 'varchar', length: 32, comment: 'fund flow type, e.g. deposit, withdraw, funding_fee, commission, liquidation, transfer, pnl, etc.' })
    fundType: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'fund flow amount' })
    amount: string;

    @Column({ type: 'varchar', length: 32, comment: 'asset type of fund flow, e.g. USDT, BTC, ETH' })
    asset: string;

    @Column({ type: 'varchar', length: 16, comment: 'fund flow direction, in or out' })
    direction: string;

    @Column({ type: 'varchar', length: 64, nullable: true, comment: 'related order id, if applicable' })
    relatedOrderId: string | null;

    @Column({ type: 'varchar', length: 64, nullable: true, comment: 'related trade id, if applicable' })
    relatedTradeId: string | null;

    @Column({ type: 'jsonb', nullable: true, comment: 'extra fund flow info' })
    extraInfo: Record<string, any> | null;

    @CreateDateColumn({ comment: 'record creation time' })
    createdAt: Date;

    @UpdateDateColumn({ comment: 'record update time' })
    updatedAt: Date;    
}

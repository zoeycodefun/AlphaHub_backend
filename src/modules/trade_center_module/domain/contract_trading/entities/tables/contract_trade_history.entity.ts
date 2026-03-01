// contract trade history data table, tick-by-tick
// store all historical trade data
import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';
/**
 * contract trade history data table
 * store every account, every contract's historical trade data(tick-by-tick), support the distinction of real trade and simulated trade
 * design: store all historical trade data for inquire, risk management, backtesting
 * extendable
 */
@Entity({ name: 'contract_trade_history' })
@Index(['trade_type', 'exchange', 'accountId', 'symbol', 'tradeId'], { unique: true })
export class ContractTradeHistoryEntity {
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
    
    @Column({ type: 'varchar', length: 64, comment: 'trade id from exchange, unique in spicific contract' })
    tradeId: string;

    @Column({ type: 'bigint', comment: 'trade timestamp(ms)'})
    tradeTimestamp: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'trade price' })
    price: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'trade amount' })
    amount: string;
    
    @Column({ type: 'varchar', length: 8, comment: 'trade side, buy or sell' })
    side: string;

    @Column({ type: 'varchar', length: 16, nullable: true, comment: 'trade taker or maker' })
    liquidityRole: string;

    @Column({ type: 'varchar', length: 64, nullable: true, comment: 'buy order id'})
    buyOrderId: string;
    
    @Column({ type: 'varchar', length:64, nullable: true, comment: 'sell order id'})
    sellOrderId: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'fee' })
    fee: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'realized PnL' })
    realizedPnl: string;

    @Column({ type: 'jsonb', nullable: true, comment: 'extra trade info' })
    extraInfo: Record<string, any> | null;

    @CreateDateColumn({ comment: 'record creation time' })
    createdAt: Date;

    @Column({ type: 'timestamp', nullable: true, comment: 'record update time' })
    updatedAt: Date;
}
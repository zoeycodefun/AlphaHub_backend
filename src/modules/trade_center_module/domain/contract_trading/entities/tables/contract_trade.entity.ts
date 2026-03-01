// detailed contract trade data 
import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';
/**
 * contract trade data table
 * store every trade data(tick-by-tick), used for trade details display, trading history, and backtesting, support real trade and simulated trade
 * support high frequency data, multiple exchanges, coins, and extendable data structure
 */
@Entity({ name: 'contract_trade' })
@Index(['trade_type', 'exchange', 'symbol', 'tradeId'], { unique: true }) // united unique index, ensures every trade data is unique
@Index(['trade_type', 'exchange', 'symbol', 'timestamp']) // for query performance
export class ContractTradeEntity {
    @PrimaryGeneratedColumn('increment', { comment: 'primary key, auto increment' })
    id: number;

    @Column({ type: 'varchar', length: 8, comment: 'trade type, real or simulated' })
    tradeType: string;

    @Column({ type: 'varchar', length: 32, comment: 'exchange name, e.g. binance' })
    exchange: string;

    @Column({ type: 'varchar', length: 64, comment: 'contract symbol, e.g. BTCUSDT' })
    symbol: string;

    @Column({ type: 'varchar', length: 64, comment: 'trade id from exchange, unique in spicific contract' })
    tradeId: string;

    @Column({ type: 'bigint', comment: 'trade timestamp(ms)'})
    timestamp: number;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'trade price' })
    price: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'trade amount' })
    amount: string;

    @Column({ type: 'varchar', length: 8, comment: 'trade side, buy or sell' })
    side: string;

    @Column({ type: 'varchar', length: 16, nullable: true, comment: 'trade taker or maker' })
    liquidity: string;

    @Column({ type: 'varchar', length: 64, nullable: true, comment: 'buy order id'})
    buyOrderId: string;

    @Column({ type: 'varchar', length:64, nullable: true, comment: 'sell order id'})
    sellOrderId: string;

    @CreateDateColumn({ comment: 'record creation time' })
    createdAt: Date;
}
/**
 * design explanation: trade_type+exchange+symbol+tradeId as unique index to ensure every trade data is unique
 */
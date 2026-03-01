// every contract historical kline data
import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';
/**
 * contract K line data table
 * store historical kline data of every contract, support multiple timeframes(1m, 5m, 15m, 30m, 1h, 4h, 1d...) and the distinction between real trade and simulated trade
 * support multiple exchanges, coins, timeframes, use trade_type to distinguish real trade and simulated trade, extendable data structure for future needs
 */
@Entity({ name: 'contract_kline' })
@Index(['trade_type', 'exchange', 'symbol', 'interval', 'openTime'], { unique: true }) // united unique index, ensures every kline is unique
@Index(['trade_type', 'exchange', 'symbol', 'interval', 'openTime']) // for query performance
export class ContractKlineEntity {
    @PrimaryGeneratedColumn('increment', { comment: 'primary key, auto increment' })
    id: number;

    @Column({ type: 'varchar', length: 8, comment: 'trade type, real or simulated' })
    tradeType: string;

    @Column({ type: 'varchar', length: 32, comment: 'exchange name, e.g. binance' })
    exchange: string;

    @Column({ type: 'varchar', length: 64, comment: 'contract symbol, e.g. BTCUSDT' })
    symbol: string;

    @Column({ type: 'varchar', length: 8, comment: 'kline interval, e.g. 1m, 5m, 15m, 30m, 1h, 4h, 1d' })
    interval: string;

    @Column({ type: 'bigint', comment: 'kline open time(ms)'})
    openTime: number;

    @Column({ type: 'bigint', comment: 'kline close time(ms)'})
    closeTime: number;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'open price' })
    open: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'high price' })
    high: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'low price' })
    low: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'close price' })
    close: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'trading volume' })
    volume: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'trading turnover(USDT)' })
    turnover: string;

    @Column({ type: 'bigint', comment: 'trading counts' })
    tradeCount: number;

    @CreateDateColumn({ comment: 'record creation time' })
    createdAt: Date;
}
/**
 * use exchange, symbol, interval, openTime as unique index to ensure kline data is unique
 * support multiple exchanges, coins, timeframes
 * extendable
 */



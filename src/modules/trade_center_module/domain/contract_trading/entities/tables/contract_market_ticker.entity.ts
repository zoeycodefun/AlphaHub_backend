import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
/**
 * contract market ticker snapshot table entity
 * storage every contract latest market ticker snapshot data, for realtime market ticker data display, orderbook, Kline chart, and other modules, support the distinction between real trade and simulated trade
 * this table just store the latest market ticker snapshot data for efficient query, historical market ticker snapshot data(historical kline data and volume, etc.) use other tables
 * support multiple exchanges, trading pairs, and contract types 
 */
@Entity({ name: 'contract_market_ticker_realtime'})
@Index(['trade_type', 'exchange', 'symbol'], { unique: true}) // unique index on exchange and symbol
export class ContractMarketTickerEntity {
    @PrimaryGeneratedColumn('increment', { comment: 'primary key ID'})
    id: number;

    @Column({ type: 'varchar', length: 8, comment: 'trade type, real or simulated' })
    tradeType: string;

    @Column({ type: 'varchar', length: 32, comment: 'exchange name, e.g. binance, okx, bybit'})
    exchange: string;

    @Column({ type: 'varchar', length: 64, comment: 'contract trading pair symbol, e.g. BTCUSDT'})
    symbol: string;

    @Column({ type: 'varchar', length: 16, comment: 'contract type, e.g. perpetual'})
    contractType: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'last price'})
    lastPrice: string;

    @Column({ type: 'decimal', precision: 32, scale:16, comment: 'index price'})
    indexPrice: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'mark price'})
    markPrice: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'funding rate(%)'})
    fundingRate: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: '24h highest price'})
    highPrice24h: string;

    @Column({ type: 'decimal', precision: 32, scale:16, comment: '24h lowest price'})
    lowPrice24h: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: '24h volume'})
    volume24h: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: '24h turnover'})
    turnover24h: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'contract open interest'})
    openInterest: string;

    @Column({ type: 'bigint', comment: 'ticker timestamp(ms)'})
    timestamp: number;

    @CreateDateColumn({ comment: 'create time automatically'})
    createdAt: Date;

    @UpdateDateColumn({ comment: 'update time automatically'})
    updatedAt: Date;

}

/**
 * design explanation:
 * exchange, symbol and trade_type are the only index for every contract, distinct real trade and simulated trade by trade_type
 * decimal type ensures high precision for price and volume data, avoid float precision issues, suitable for financial data storage
 * timestamp is for the recognition of the new and old market ticker data
 */
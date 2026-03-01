import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';
/**
 * contract orderbook data snapshot data
 * store buy and sell depth data in spicific time point of every contract, used for orderbook depth chart display, orderbook depth chart, and matching engine, etc.
 * support distinction between real trade and simulated trade
 * just store snapshot data, not historical data
 * support multiple exchanges, coins
 * bids and asks data store in JSON format, for high frenquency update and query performance, and also support extendable data structure in the future
 */
@Entity({ name: 'contract_orderbook'})
@Index(['trade_type', 'exchange', 'symbol', 'timestamp'], { unique: true }) // united unique index, ensures every timestamp orderbook snapshot is unique
@Index(['trade_type', 'exchange', 'symbol', 'timestamp']) // for query performance
export class ContractOrderbookEntity {
    @PrimaryGeneratedColumn('increment', { comment: 'primary key, auto increment' })
    id: number;

    @Column({ type: 'varchar', length: 8, comment: 'trade type, real or simulated' })
    tradeType: string;

    @Column({ type: 'varchar', length: 32, comment: 'exchange name, e.g. binance' })
    exchange: string;

    @Column({ type: 'varchar', length: 64, comment: 'contract symbol, e.g. BTCUSDT' })
    symbol: string;

    @Column({ type: 'bigint', comment: 'orderbook snapshot timestamp(ms)'})
    timestamp: number;

    @Column({ type: 'jsonb', comment: 'bids depth([{price: string, amount: string}], sorted by price desc)' })
    bids: Array<{ price: string; amount: string }>;

    @Column({ type: 'jsonb', comment: 'asks depth([{price: string, amount: string}], sorted by price asc)' })
    asks: Array<{ price: string; amount: string }>;

    @CreateDateColumn({ comment: 'record creation time' })
    createdAt: Date;
}
/**
 * design explanation: trade_type+exchange+symbol+timestamp as unique index to ensure every orderbook snapshot is unique
 * bids and asks are JSON array, and timestamp is in milliseconds
 * extendable
 */
// contract order data table(limit order saver), including limit order, stop loss order, take profit order, sometimes some market orders will in also
import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
/**
 * contract order data
 * store every account, every contract's untraded order data, support limit order, market order, stop loss order, take profit order, and distiction of real trade and simulated trade
 * only store untraded order data, no historical order data
 * support multiple exchanges, coins, symbols, order types
 * extendable
 */
@Entity({ name: 'contract_order' })
@Index(['trade_type', 'exchange', 'accountId', 'symbol', 'orderId'], { unique: true })
export class ContractOrderEntity {
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

    @Column({ type: 'varchar', length: 64, comment: 'order id from exchange, unique in specific contract' })
    orderId: string;

    @Column({ type: 'varchar', length: 16, comment: 'order type, limit, market, stop_loss, take_profit' })
    orderType: string;

    @Column({ type: 'varchar', length: 8, comment: 'order side, buy or sell' })
    side: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'order price, for market order, price is null or 0' })
    price: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'order amount' })
    amount: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'order filled amount' }) // 已成交数量
    filledAmount: string;

    @Column({ type: 'varchar', length: 16, comment: 'only reduce position, reduce_only or normal'})
    reduceOnly: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, nullable: true, comment: 'stop loss price'})
    stopLossPrice: string | null;

    @Column({ type: 'decimal', precision: 32, scale: 16, nullable: true, comment: 'take profit price'})
    takeProfitPrice: string | null;

    @Column({ type: 'varchar', length: 16, comment: 'order status, open, partially_filled, filled, cancelled' })
    status: string;

    @Column({ type: 'bigint', comment: 'order creation timestamp(ms)' })
    orderTime: string;

    @Column({ type: 'jsonb', nullable: true, comment: 'extra order info' })
    extraInfo: Record<string, any> | null;

    @CreateDateColumn({ comment: 'record creation time' })
    createdAt: Date;
    
    @UpdateDateColumn({ comment: 'record update time' })
    updatedAt: Date;
}
/**
 * use exchange+accountId+symbol+orderId+trade_type as unique index to ensure every order data is unique
 * support multiple types of orders and mltiple status
 * extendable
 */


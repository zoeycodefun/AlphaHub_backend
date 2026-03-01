// contract order history data table
// used for storage of historical order data, including filled orders, cancelled orders, expired orders, etc.
import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
/**
 * contract order history data table
 * store every account, every contract's historical order data, including filled orders, cancelled orders, expired orders, etc. Support the distinction of real trade and simulated trade
 * design: store all historical order data for inquire, risk management, etc.
 * support multiple exchanges, accounts, coins, order types
 * extendable
 */
@Entity({ name: 'contract_order_history'})
@Index(['trade_type', 'exchange', 'accountId', 'symbol', 'orderId'], { unique: true })
export class ContractOrderHistoryEntity {
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

    @Column({ type: 'varchar', length: 8, comment: 'order direction, buy or sell' })
    side: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'order price, for market order, price is null or 0' })
    price: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'order amount' })
    amount: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'order filled amount' })
    filledAmount: string;

    @Column({ type: 'varchar', length: 16, comment: 'only reduce position, reduce_only or normal'})
    reduceOnly: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, nullable: true, comment: 'stop loss price'})
    stopLossPrice: string | null;

    @Column({ type: 'decimal', precision: 32, scale: 16, nullable: true, comment: 'take profit price'})
    takeProfitPrice: string | null;

    @Column({ type: 'varchar', length: 16, comment: 'order status, open, partially_filled, filled, cancelled, expired' })
    status: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'average fill price' }) // 成交均价
    averageFillPrice: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'fee'})
    fee: string;

    @Column({ type: 'varchar', precision: 32, scale: 16, comment: 'profit'})
    profit: string;

    @Column({ type: 'bigint', comment: 'order creation timestamp(ms)' })
    orderTime: string;

    @Column({ type: 'bigint', comment: 'order filled timestamp(ms)'})
    finishTime: string;

    @Column({ type: 'jsonb', nullable: true, comment: 'extra order info' })
    extraInfo: Record<string, any> | null;

    @CreateDateColumn({ comment: 'record creation time' })
    createdAt: Date;

    @UpdateDateColumn({ comment: 'record update time' })
    updatedAt: Date;
}
/**
 * design is similar to other tables
 */


// contract position data table
import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
/**
 * contract position data table
 * store every position data, support multiple exchanges, coins, symbols, and distiction of real trade and simulated trade
 * only store latest position data to update
 * extendable
 */
@Entity({ name: 'contract_position' })
@Index(['trade_type', 'exchange', 'accountId', 'symbol', 'positionSide'], { unique: true }) // united unique index, ensures every position data is unique
export class ContractPositionEntity {
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

    @Column({ type: 'varchar', length: 16, comment: 'contract type, e.g. perpetual' })
    contractType: string;

    @Column({ type: 'varchar', length: 16, comment: 'position side, long or short' })
    positionSide: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'leverage amount' })
    leverage: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'position amount' })
    positionAmount: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'entry price' })
    entryPrice: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'mark price' })
    markPrice: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'liquidation price' })
    liquidationPrice: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'margin ratio'}) // 维持保证金比率
    marginRatio: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'margin'})
    margin: string; // 保证金

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'unrealized PnL' })
    unrealizedPnl: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'realized PnL' })
    realizedPnl: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'funding fee' })
    fundingFee: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, comment: 'ROI'})
    roi: string;

    @Column({ type: 'decimal', precision: 32, scale: 16, nullable: true, comment: 'stop loss price'})
    stopLossPrice: string | null;

    @Column({ type: 'decimal', precision: 32, scale: 16, nullable: true, comment: 'take profit price'})
    takeProfitPrice: string | null;

    @Column({ type: 'bigint', comment: 'position update timestamp(ms)'})
    updateTime: string;

    @Column({ type: 'jsonb', nullable: true, comment: 'additional data, e.g. exchange specific position data'})
    extra: Record<string, any> | null;

    @CreateDateColumn({ comment: 'record creation time' })
    createdAt: Date;

    @UpdateDateColumn({ comment: 'record update time' })
    updatedAt: Date;
}
/**
 * use trade_type to distinct real trade and simulated trade
 * use exchange+accountId+symbol+positionSide as unique index to ensure position data is unique
 * only store snapshot to ensure efficiency
 */
import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
/**
 * strategy bot history data table
 */
@Entity({ name: 'strategy_bot_history' })
@Index(['trade_type', 'exchange', 'accountId', 'botId', 'startTime'], { unique: true })
export class StrategyBotHistoryEntity {
    @PrimaryGeneratedColumn('increment', { comment: 'primary key, auto increment' })
    id: number;

    @Column({ type: 'varchar', length: 8, comment: 'trade type, real or simulated' })
    tradeType: string;

    @Column({ type: 'varchar', length: 32, comment: 'exchange name, e.g. binance' })
    exchange: string;

    @Column({ type: 'varchar', length: 64, comment: 'account id from exchange' })
    accountId: string;

    @Column({ type: 'varchar', length: 64, comment: 'strategy bot id' })
    botId: string;

    @Column({ type: 'varchar', length: 64, comment: 'strategy type, e.g. grid, trend, arbitrage, etc.'})
    strategyType: string;

    @Column({ type: 'jsonb', comment: 'parameters of strategy bot when start running, in the format of JSON' })
    params: Record<string, any>;

    @Column({ type: 'varchar', length: 16, comment: 'final result of strategy bot, e.g. success, error, stop, etc.'})
    result: string;

    @Column({ type: 'varchar', length: 256, nullable: true, comment: 'logs and error messages during strategy bot running'})
    log: string | null;

    @Column({ type: 'bigint', comment: 'strategy bot start time, timestamp in ms' })
    startTime: string;
    
    @Column({ type: 'bigint', comment: 'strategy bot end time, timestamp in ms' })
    endTime: string;

    @CreateDateColumn({ comment: 'record creation time' })
    createdAt: Date;

    @UpdateDateColumn({ comment: 'record update time' })
    updatedAt: Date;
}

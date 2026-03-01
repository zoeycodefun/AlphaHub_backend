// strategy bot running data table
import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
/**
 * strategy bot running data table
 * store all running strategy bot data, support monitor, manage, and other operations
 */
@Entity({ name: 'strategy_bot_running' })
@Index(['trade_type', 'exchange', 'accountId', 'botId'], { unique: true })
export class StrategyBotRunningEntity {
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

    @Column({ type: 'jsonb', comment: 'running parameters of strategy bot, in the format of JSON' })
    params: Record<string, any>;

    @Column({type: 'varchar', length: 16, comment: 'running status of strategy bot, e.g. running, paused, stopped, error, etc.'})
    status: string;

    @Column({ type: 'varchar', length: 256, nullable: true, comment: 'running logs and error messages'})
    log: string | null;

    @CreateDateColumn({ comment: 'record creation time' })
    createdAt: Date;
    
    @UpdateDateColumn({ comment: 'record update time' })
    updatedAt: Date;

}
/**
 * Token bucket rate limiter
 * each exchange gets its own TokenBucket instance to track its individual rate limits
 * uses a per-bucket mutex pattern to guarantee thread-safe token consumption
 */
import { Logger } from '@nestjs/common';
/**
 * token bucket configuration
 */
export interface TokenBucketConfig {
    // max token in the bucket==burst capacity
    capacity: number;
    // tokens added per second==sustained RPS
    refillRate: number;
    // initial token count, dedault to full capacity
    initialTokens?: number;
}
/**
 * result of a token consumption attempt
 */
export interface ConsumeResult {
    allowed: boolean;
    remainingTokens: number;
    retryAfterMs?: number; // seconds until next token is available if not allowed
}
/**
 * TokenBucket -- thread-safe token bucket rate limiter
 * Algorithm:
 * 1. bucket holds up to 'capacity' tokens
 * 2. tokens are replenished at 'refillRate' tokens/per second
 * 3. each API call costs 1 token(or N tokens for weigh-based limits)
 * 4. if no tokens are available, the call is rejected with a retryAfterMs hint
 */
export class TokenBucket {
    private readonly logger: Logger;
    private tokens:number;
    private lastRefillTime: number;
    private readonly capacity: number;
    private readonly refillRate: number;

    // simple mutex using a promise chain to prevent race conditions
    private mutex: Promise<void> = Promise.resolve();
    constructor(config: TokenBucketConfig, label = 'TokenBucket') {
        this.capacity = config.capacity;
        this.refillRate = config.refillRate;
        this.tokens = config.initialTokens ?? config.capacity;
        this.lastRefillTime = Date.now();
        this.logger = new Logger(label);
    }
    /**
     * attempt to consume 'cost' tokens from the bucket
     * @param cost number of tokens to consume(default 1)
     * @returns consumeResult indicating whether the call is allowed
     */
    async consume(cost = 1): Promise<ConsumeResult> {
        return new Promise<ConsumeResult>(( resolve ) => {
            // chain onto the mutex to serialize access to the bucket state
            this.mutex = this.mutex.then(() => {
                this.refill()
                if (this.tokens >= cost) {
                    this.tokens -= cost;
                    resolve({
                        allowed: true,
                        remainingTokens: Math.floor(this.tokens),
                    });
                } else {
                    // calculate how long until enough tokens are available
                    const tokensNeeded = cost - this.tokens;
                    const retryAfterMs = Math.ceil((tokensNeeded / this.refillRate) * 1000);
                    resolve({
                        allowed: false,
                        remainingTokens: Math.floor(this.tokens),
                        retryAfterMs,
                    });
                }
            });
        });
    }
    /**
     * block until tokens are available(async wait version)
     * use this in non-critical paths where wailting is acceptable
     * @param cost tokens to consume
     * @param maxWaitMs maximum ms to wait (throws if exceeded)
     */
    async consumeOrWait(cost = 1, maxWaitMs = 5000): Promise<void> {
        const result = await this.consume(cost);
        if (result.allowed) return;
        if (result.retryAfterMs! > maxWaitMs) {
            throw new Error(
                `Rate limit exceeded: need to wait ${result.retryAfterMs} ms but maxWaitMs is ${maxWaitMs}ms`
            );
        }
    }
    /**
     * get current token count without consuming
     */
    peek(): number {
        this.refill();
        return Math.floor(this.tokens);
    }
    /**
     * reset bucket to full capacity (e.g. reset after the server restarts)
     */
    reset(): void {
        this.tokens = this.capacity;
        this.lastRefillTime = Date.now();
        this.logger.debug('Token bucket reset to full capacity');
    }
    /**
     * current bucket stats (useful for monitoring/logging)
     */
    getStats(): {
        tokens: number;
        capacity: number;
        refillRate: number;
    } {
        this.refill();
        return {
            tokens: Math.floor(this.tokens),
            capacity: this.capacity,
            refillRate: this.refillRate,
        };
    }
    /**
     * refill tokens based on elapsed time since last refill
     * called before every consume() to ensure tokens are up-to-date
     * lazy refill strategy to avoid unnecessary timers when the bucket is idle
     */
    private refill(): void {
        const now = Date.now();
        const elapsedSeconds = (now - this.lastRefillTime) / 1000;
        const newTokens = elapsedSeconds * this.refillRate;
        if (newTokens > 0) {
            this.tokens = Math.min(this.capacity, this.tokens + newTokens);
            this.lastRefillTime = now;
        }
    }
    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
/**
 * pre-configured rate limit profiles for major excnahges
 * update these based on the latest API docs and observed limits
 */
export const EXCHANGE_RATE_LIMIL_PROFILES: Record<string, TokenBucketConfig> = {
    // binance: https://developers.binance.com/docs/zh-CN/binance-spot-api-docs
    binance_market_data: { capacity: 20, refillRate: 20 }, // this system use 1200 weight per minute for REST API, so 1200 weight/min = 20 weight/sec
    binance_trading: { capacity: 10, refillRate: 10 }, // this system use 10 orders/sec for trading endpoints
    binance_account: { capacity: 5, refillRate: 5 },
    // okx: https://www.okx.com/docs-v5/zh/#overview-api-resources-and-support
    okx_market_data: { capacity: 20, refillRate: 10 },
    okx_trading: { capacity: 60, refillRate: 30 },
    okx_account: { capacity: 10, refillRate: 5 },
    // hyperliquid: https://github.com/hyperliquid-dex/hyperliquid-python-sdk
    hyperliquid_market_data: { capacity: 10, refillRate: 10 },
    hyperliquid_trading: { capacity: 5, refillRate: 5 },
} as const;
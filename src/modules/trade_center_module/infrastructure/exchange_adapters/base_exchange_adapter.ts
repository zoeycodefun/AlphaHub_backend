/**
 * abstract base class for all CCXT-based exchange adapters
 * provides:
 * 1. unified error handling and logging
 * 2. rate limit injection
 * 3. retry logic
 * 4. response normalization
 */
import { Logger } from '@nestjs/common';
import * as ccxt from 'ccxt';
import {
    IExchangeAdapter,
    OhlvcBar,
    OrderBook,
    MarketTicker,
    AccountBalance,
    BalanceAsset,
    OpenPosition,
    PlaceOrderParams,
    OrderResult,
    FundingRate,
    AdapterCapabilities
} from './interfaces/exchange_adapter.interface';
import { TokenBucket } from './rate_limiter/token_bucket';
/**
 * categorized exchange error types for structured error handling
 * maps to HTTP status codes and retry decisions
 */
export enum ExchangeErrorType {
    NETWORK_ERROR = 'NETWORK_ERROR', // e.g. timeout, connection refused -- retry
    RATE_LIMITED  = 'RATE_LIMITED', // 429 error -- wait and retry
    INVALID_CREDENTIAL = 'INVALID_CREDENTIAL', // 401 or 403 error -- do not retry, mark user account invalid
    INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS', // not enough balance -- do not retry
    INVALID_ORDER = 'INVALID_ORDER', // bad order parameters -- do not retry
    EXCHANGE_ERROR = 'EXCHANGE_ERROR', // 5xx error from exchange -- retry with backoff
    PARSE_ERROR = 'PARSE_ERROR', // unexpected response shape -- do not retry
    UNKNOWN = 'UNKNOWN', // catch-all for unclassified errors
}
/**
 * structured exchange error
 * carries enough context for the caller to decide retry or user feedback
 */
export class ExchangeAdapterError extends Error {
    constructor(
        public readonly errorType: ExchangeErrorType,
        public readonly originalMessage: string,
        public readonly exchangeId: string,
        public readonly retryable: boolean,
        public readonly httpStatus?: number,
        public readonly rawError?: unknown
    ) {
        super(`[${exchangeId}] ${errorType}: ${originalMessage}`);
        this.name = 'ExchangeAdapterError';
    }
}
/**
 * retry configuration for network-level failures
 */
interface RetryConfig {
    maxAttempts: number;
    baseDelayMs: number; // will be doubled each retry attempt (exponential backoff)
    maxDelayMs: number;
}
const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxAttempts: 3,
    baseDelayMs: 500, // 0.5 second
    maxDelayMs: 8000, // 8 seconds
};
/**
 * BaseExchangeAdapter
 * abstract base class that every CCXT-based exchange adapter should extend
 * responsibilities:
 * 1. holds and configures the ccxt exchange instance
 * 2. provides `executeWithRetry()` wrapper: rate limit -> execute -> catch -> classify error -> retry if applicable
 * 3. provides normalization helpers for converting raw CCXT responses to the standard interface types
 * 4. subclasses override the abstract methods tp plug in exchange-specific behaviour 
 */
export abstract class BaseExchangeAdapter implements IExchangeAdapter {
    protected readonly logger: Logger;
    protected readonly exchange: ccxt.Exchange;
    // each adapter receives its own pre-configured rate limit buckets from the token bucket factory
    protected readonly marketDataBucket: TokenBucket;
    protected readonly tradingBucket: TokenBucket;
    protected readonly accountBucket: TokenBucket;

    abstract readonly exchangeId: string;
    abstract readonly capabilities: AdapterCapabilities;

    constructor(
        exchange: ccxt.Exchange,
        marketDataBucket: TokenBucket,
        tradingBucket: TokenBucket,
        accountBucket: TokenBucket
    ) {
        this.exchange = exchange;
        this.marketDataBucket = marketDataBucket;
        this.tradingBucket = tradingBucket;
        this.accountBucket = accountBucket;
        this.logger = new Logger(this.constructor.name);
    }
    // market data(concrete implementations shared by all CCXT adapters)
    async fetchOhlcv(
        symbol: string,
        timeframe: string,
        since?: number,
        limit = 500): Promise<OhlvcBar[]> {
            return this.executeWithRetry(
                'fetchOhlcv',
                this.marketDataBucket,
                async () => {
                    const raw = await this.exchange.fetchOHLCV(symbol, timeframe, since, limit);
                    return raw.map(this.normalizeOhlcvBar);
                });
    }
    async fetchOrderBook(
        symbol: string,
        depth = 20): Promise<OrderBook> {
            return this.executeWithRetry(
                'fetchOrderBook',
                this.marketDataBucket,
                async () => {
                    const raw = await this.exchange.fetchOrderBook(symbol, depth);
                    return this.normalizeOrderBook(raw);
                });
        }
        async fetchTicker(symbol: string): Promise<MarketTicker> {
            return this.executeWithRetry(
                'fetchTicker',
                this.marketDataBucket,
                async () => {
                    const raw = await this.exchange.fetchTicker(symbol);
                    return this.normalizeTicker(raw);
                });
        }
        async fetchTickers(symbols: string[]): Promise<MarketTicker[]> {
            return this.executeWithRetry(
                'fetchTickers',
                this.marketDataBucket,
                async () => {
                    const raw = await this.exchange.fetchTickers(symbols);
                    return Object.values(raw).map(this.normalizeTicker.bind(this));
                });
        }
        async fetchBalance(accountType?: string): Promise<AccountBalance> {
            return this.executeWithRetry(
                'fetchBalance',
                this.accountBucket,
                async () => {
                    const params = accountType ? { type: accountType } : {};
                    const raw = await this.exchange.fetchBalance(params);
                    return this.normalizeBalance(raw);
                });
        }
        async fetchOpenPositions(symbol?: string[]): Promise<OpenPosition[]> {
            return this.executeWithRetry(
                'fetchOpenPositions',
                this.accountBucket,
                async () => {
                    const raw = await this.exchange.fetchPositions(symbol);
                    return raw
                    .filter((position) => position.contracts && position.contracts > 0)
                    .map(this.normalizePosition.bind(this));
                });
        }
        async placeOrder(params: PlaceOrderParams): Promise<OrderResult> {
            return this.executeWithRetry(
                'placeOrder',
                this.tradingBucket,
                async () => {
                    const raw = await this.exchange.createOrder(
                        params.symbol,
                        params.type,
                        params.side,
                        params.amount,
                        params.price,
                        params.params,
                    );
                    return this.normalizeOrder(raw);
                });
        }
        async cancelOrder(orderId: string, symbol: string): Promise<boolean> {
            return this.executeWithRetry(
                'cancelOrder',
                this.tradingBucket,
                async () => {
                    await this.exchange.cancelOrder(orderId, symbol);
                    return true;
                });
        }
        async fetchOpenOrders(symbol?: string): Promise<OrderResult[]> {
            return this.executeWithRetry(
                'fetchOpenOrders',
                this.tradingBucket,
                async () => {
                    const raw = await this.exchange.fetchOpenOrders(symbol);
                    return raw.map(this.normalizeOrder.bind(this));
                });
        }
        async testConnection(): Promise<{ 
            success: boolean; 
            latencyMs: number; 
            error?: string; }> {
                const start = Date.now();
                try {
                    await this.exchange.fetchTime();
                    return {
                        success: true,
                        latencyMs: Date.now() - start
                    };
                } catch (error) {
                    const error = this.classifyError(error);
                    return {
                        success: false,
                        latencyMs: Date.now() - start,
                        error: error.originalMessage
                    };
                }
        }
        async destory(): Promise<void> {
            // CCXT does not require explicit teardown, but subclasses with websocket connections can override this method for cleanup
        }

        /**
         * core retry / rate limit wrapper
         * executeWithRetry: central execution engine
         * flow:
         * 1. consume rate limit tokens (or wait if using consumeOrWait)
         * 2. call the provided `fn(function)` callback
         * 3. on error: classify, decide whether to retry, apply exponential backoff
         * 4. after maxAttempts: throw the last ExchangeAdapterError
         */
        protected async executeWithRetry<T>(
            operationName: string,
            bucket: TokenBucket,
            fn: () => Promise<T>,
            retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG,
        ): Promise<T> {
            let lastError: ExchangeAdapterError | null = null;
            for ()
        }

        
}


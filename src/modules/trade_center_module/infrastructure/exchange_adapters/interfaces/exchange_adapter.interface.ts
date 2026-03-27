/**
 * united exchanges adapter interface definition
 * all exchanges adapter(binance, okx, hyperliquid...) should implement this interface
 * this adapter ensures consistent API across different exchanges and supports clean dependency inversion
 */

/**
 * standardized OHLCV(k-line) bar representation(normalized from raw data from exchange response to a consistent structure)
export interface OhlvcBar {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    quoteVolume?: number;
}
/**
 * standardized order book snapshot
 */
export interface OrderBook {
    symbol: string;
    timestamp: number;
    bids: [number, number][]; // [price, size][]
    asks: [number, number][];
    sequence?: number; // for consistency verification
}
/**
 * standardized market ticker snapshot
 */
export interface MarketTicker {
    symbol: string;
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    last: number;
    bid: number;
    ask: number;
    volume: number;
    quoteVolume: number;
    change: number; // absolute price change
    changePercent: number; // percentage price change
    // futures characteristics
    markPrice?: number;
    indexPrice?: number;
    fundingRate?: number;
    nextFundingTime?: number;
    openInterest?: number;
    contractSize?: number;
}
/**
 * standardized account balance
 * normalized to a consistent structure across all exchanges
 */
export interface AccountBalance {
    timestamp: number;
    totalEquity: number; // total account equity in quote currency(usually USD)
    availableBalance: number; // available balance for trading
    usedMargin?: number; // margin currently in use(futures trading)
    unrealizedPnl?: number; // unrealized profit and loss(futures trading)
    assets: BalanceAsset[]
}
export interface BalanceAsset {
    currency: string;
    free: number; // available balance of the asset
    used: number;
    total: number;
    usdValue?: number;
}
/**
 * standardized open position(futures/perps)
 */
export interface Position {
    currency: string;
    free: number; // available balance of the asset
    used: number; // in orders/margin
    total: number;
    usdValue?: number;
}
/**
 * standardized open position(futures/perps)
 */
export interface OpenPosition {
    symbol: string;
    side: 'long' | 'short';
    size: number;
    entryPrice: number;
    markPrice?: number;

}
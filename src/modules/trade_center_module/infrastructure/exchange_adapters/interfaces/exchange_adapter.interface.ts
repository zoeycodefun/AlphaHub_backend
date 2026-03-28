/**
 * united exchanges adapter interface definition
 * all exchanges adapter(binance, okx, hyperliquid...) should implement this interface
 * this adapter ensures consistent API across different exchanges and supports clean dependency inversion
 */

/**
 * standardized OHLCV(k-line) bar representation
 * normalized from raw data from exchange response to a consistent structure
*/
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
    used: number; // in orders/margin
    total: number;
    usdValue?: number; // usd equivalent
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
    liquidationPrice: number;
    leverage: number;
    margin: number;
    marginType: 'isolated' | 'cross';
    unrealizedPnl: number;
    realizedPnl: number;
    percentage: number;
    timestamp: number;
}
/**
 * order place request parameters
 */
export interface PlaceOrderParams {
    symbol: string;
    side: 'buy' | 'sell';
    type: 'market' | 'limit' | 'stop_loss' | 'take_profit' | 'stop_limit';
    amount: number;
    price?: number; // required for limit and stop_limit orders
    stopPrice?: number; // required for stop orders
    leverage?: number;
    marginType?: 'isolated' | 'cross';
    clientOrderId?: string; // optional client-defined order ID for tracking
    reduceOnly?: boolean;
    postOnly?: boolean;
    timeInForce?: 'GTC' | 'IOC' | 'FOK';
    params?: Record<string, unknown>; // additional exchange-specific parameters
}
/**
 * standardized order response
 */
export interface OrderResult {
    orderId: string;
    clientOrderId?: string;
    symbol: string;
    side: 'buy' | 'sell';
    type: string;
    status: 'open' | 'closed' | 'canceled' | 'rejected' | 'partially_filled';
    price: number;
    amount: number;
    filled: number;
    remaining: number;
    cost: number;
    averagePrice: number;
    fee?:number;
    feeCurrency?: string;
    timestamp: number;
}
/**
 * funding rate record for futures/perps
 */
export interface FundingRate {
    symbol: string;
    fundingRate: number;
    fundingTime: number;
    nextFundingTime: number;
}
/**
 * exchange adapter capability flags
 */
export interface AdapterCapabilities {
    spot: boolean;
    futures: boolean;
    swap: boolean;
    websocket: boolean;
    fetchBalance: boolean;
    fetchPositions: boolean;
    placeOrder: boolean;
    cancelOrder: boolean;
    fetchFundingRate: boolean;
    fetchOpenInterest: boolean;
}
/**
 * IExchangeAdapter - core contract for all exchange adapters
 * all adapters must implement this interface to be used in the system
 * optional methods should check adapter capabilities before calling
 */
export interface IExchangeAdapter {
    // exchange identifier
    readonly exchangeId: string;
    // adapter capability declarations
    readonly capabilities: AdapterCapabilities;


    // market data
    /**
     * fetch OHLCV(candlestick) data
     * @param symbol 'BTC/USDT' for perps or other format
     * @param timeframe '1m', '5m', '1h', etc.
     * @param since unix ms, fetch candles after this timestamp
     * @param limit max number of candles to fetch
     */
    fetchOhlcv(
        symbol: string,
        timeframe: string,
        since?: number,
        limit?: number
    ): Promise<OhlvcBar[]>;
    /**
     * fetch current order book snapshot
     * @param symbol 'BTC/USDT
     * @param depth levels of order book to fetch, e.g. 5, 10, 20, etc.
     */
    fetchOrderBook(
        symbol: string,
        depth?: number
    ): Promise<OrderBook>;
    /**
     * fetch ticker for a single symbol
     */
    fetchTicker(symbol: string): Promise<MarketTicker>;
    /**
     * fetch tickers for multiple symbols in one call
     */
    fetchTickers(symbols: string[]): Promise<MarketTicker[]>;

    // account and position
    /**
     * fetch account balance
     * @param accountType 'spot' | 'futures' | 'margin'
     */
    fetchBalance(accountType?: string): Promise<AccountBalance>;
    /**
     * fetch open positions(for futures/perps)
     * @param symbols filtered by symbols, undefined for all positions
     */
    fetchOpenPositions(symbol?: string[]): Promise<OpenPosition[]>;


    // trading
    /**
     * place ac order
     */
    placeOrder(params: PlaceOrderParams): Promise<OrderResult>;
    /**
     * cancel an existing order
     * @param orderId exchange assigned order ID
     * @param symbol required for some exchanges to identify the order
     */
    cancelOrder(orderId: string, symbol:string): Promise<boolean>;
    /**
     * fetch details of a specific order
     */
    fetchOrder(orderId: string, symbol: string): Promise<OrderResult>;
    /**
     * fetch all open orders
     */
    fetchOpenOrders(symbol?: string): Promise<OrderResult[]>;


    // futures specific
    /**
     * fetch current funding rate
     */
    fetchFundingRate?(symbol: string): Promise<FundingRate>;
    /**
     * fetch funding rate history
     */
    fetchFundingRateHistory?(symbol: string, since?: number, limit?: number): Promise<FundingRate[]>;


    // adapter lifecycle
    /**
     * test connectivity and credentials validity
     * used by account sync service to update connection status
     */
    testConnection(): Promise<{ success: boolean; latencyMs: number; error?: string }>;
    /**
     * graceful cleanup on shutdown
     */
    destory?(): Promise<void>;
    
}
import { registerAs } from "@nestjs/config";
import * as Joi from 'joi';

// exchange configuration interface
export interface ExchangeConfig {
    [exchangeName: string]: {
        apiKey: string;
        apiSecret: string;
        testnet?: boolean;
        timeout?: number;
        rateLimit?: number;
    };
}

// individual exchange configuration interface
export interface SingleExchangeConfig {
    apiKey: string;
    apiSecret: string;
    testnet: boolean;
    timeout: number;
    rateLimit: number;
}
// Joi validation schema for exchange configuration
export const exchangeConfigValidation = Joi.object({
    // validate exchange configuration pattern
}).pattern(
    /^EXCHANGES__/, // environment variables starting with EXCHANGES__
    Joi.object({
        API_KEY: Joi.string().min(10).max(200).required(), // API keys are typically long strings
        API_SECRET: Joi.string().min(20).max(500).required(), // API secrets are longer
        TESTNET: Joi.boolean().default(false),
        TIMEOUT: Joi.number().integer().min(5000).max(120000).default(30000), // 5s to 2min
        RATE_LIMIT: Joi.number().integer().min(1).max(1000).default(100), // reasonable rate limits
    })
);

// export exchange configuration
export default registerAs('exchanges', (): ExchangeConfig => {
    const exchanges: ExchangeConfig = {};

    // helper function for safe integer parsing
    const parseIntSafe = (value: string | undefined, defaultValue: number): number => {
        if (!value) return defaultValue;
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? defaultValue : parsed;
    };

    // helper function for safe boolean parsing
    const parseBoolSafe = (value: string | undefined, defaultValue: boolean): boolean => {
        if (!value) return defaultValue;
        return value.toLowerCase() === 'true';
    };

    // iterate over environment variables to find those that start with EXCHANGES__
    Object.keys(process.env).forEach((key) => {
        if (key.startsWith('EXCHANGES__')) {
            const parts = key.split('__');
            if (parts.length !== 3) {
                console.warn(`Invalid exchange configuration key format: ${key}. Expected: EXCHANGES__<EXCHANGE_NAME>__<CONFIG_KEY>`);
                return;
            }

            const [, exchangeName, configKey] = parts;

            // validate exchange name (should be alphanumeric with underscores)
            if (!/^[A-Z_][A-Z0-9_]*$/.test(exchangeName)) {
                console.warn(`Invalid exchange name: ${exchangeName}. Should be uppercase with underscores.`);
                return;
            }

            // initialize exchange config if not exists
            if (!exchanges[exchangeName]) {
                exchanges[exchangeName] = {
                    apiKey: '',
                    apiSecret: '',
                    testnet: false,
                    timeout: 30000,
                    rateLimit: 100,
                };
            }

            const value = process.env[key];
            if (!value) {
                console.warn(`Empty value for exchange configuration: ${key}`);
                return;
            }

            // parse and assign configuration values
            switch (configKey) {
                case 'API_KEY':
                    exchanges[exchangeName].apiKey = value.trim();
                    break;
                case 'API_SECRET':
                    exchanges[exchangeName].apiSecret = value.trim();
                    break;
                case 'TESTNET':
                    exchanges[exchangeName].testnet = parseBoolSafe(value, false);
                    break;
                case 'TIMEOUT':
                    exchanges[exchangeName].timeout = parseIntSafe(value, 30000);
                    break;
                case 'RATE_LIMIT':
                    exchanges[exchangeName].rateLimit = parseIntSafe(value, 100);
                    break;
                default:
                    console.warn(`Unknown exchange configuration key: ${configKey} for ${exchangeName}`);
            }
        }
    });

    return exchanges;
});

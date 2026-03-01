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
// Joi validation schema for exchange configuration
export const exchangeConfigValidation = Joi.object({
    // auto validate that the environment variable is a valid JSON string and matches the expected structure

}).pattern(/^EXCHANGES__/, Joi.object({
    API_KEY: Joi.string().required(),
    API_SECRET: Joi.string().required(),
    TESTNET: Joi.boolean().default(false),
    TIMEOUT: Joi.number().default(30000),
    RATE_LIMIT: Joi.number().default(100)
}));

// export exchange configuration
export default registerAs('exchanges', (): ExchangeConfig => {
    const exchanges: ExchangeConfig = {};
    // iterate over environment variables to find those that start with EXCHANGES__
    Object.keys(process.env).forEach((key) => {
        if (key.startsWith('EXCHANGES__')) {
            const [, exchangeName, configKey] = key.split('__');
            if (!exchanges[exchangeName]) {
                exchanges[exchangeName] = {} as any;
            }
            const value = process.env[key];
            switch (configKey) {
                case 'API_KEY':
                    exchanges[exchangeName].apiKey = value;
                    break;
                case 'API_SECRET':
                    exchanges[exchangeName].apiSecret = value;
                    break;
                case 'TESTNET':
                    exchanges[exchangeName].testnet = value === 'true';
                    break;
                case 'TIMEOUT':
                    exchanges[exchangeName].timeout = parseInt(value, 10);
                    break;
                case 'RATE_LIMIT':
                    exchanges[exchangeName].rateLimit = parseInt(value, 10);
                    break;
            }
        }
    });
    return exchanges;
});

import { registerAs } from "@nestjs/config";
import * as Joi from 'joi';

// application configuration interface
export interface AppConfig {
    name: string;
    version: string;
    port: number;
    environment: string;
    loglevel: string;
    corsOrigins: string[];
    rateLimit: {
        ttl: number;
        limit: number;
    };
    security: {
        helmet: boolean;
        rateLimit: boolean;
        compression: boolean;
    };
}

// Joi validation schema for application configuration
export const appConfigValidation = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'staging').default('development'),
    PORT: Joi.number().default(3001),
    APP_NAME: Joi.string().default('AlphaHub'),
    APP_VERSION: Joi.string().default('1.0.0'),
    LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
    CORS_ORIGINS: Joi.string().default('http://localhost:5173'),
});

// export application configuration
export default registerAs('app', (): AppConfig => ({
    name: process.env.APP_NAME || 'AlphaHub',
    version: process.env.APP_VERSION || '1.0.0',
    port: parseInt(process.env.PORT, 10) || 3001,
    environment: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
    rateLimit: {
        ttl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60,
        limit: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    },
    security: {
        helmet: process.env.SECURITY_HELMET !== 'false',
        rateLimit: process.env.SECURITY_RATE_LIMIT !== 'false',
        compression: process.env.SECURITY_COMPRESSION !== 'false',
    },
}));


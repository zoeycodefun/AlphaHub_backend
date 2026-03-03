import { registerAs } from "@nestjs/config";
import * as Joi from 'joi';

// application configuration interface
export interface AppConfig {
    name: string;
    version: string;
    port: number;
    environment: string;
    logLevel: string;
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
    PORT: Joi.number().integer().min(1000).max(65535).default(3001),
    APP_NAME: Joi.string().min(1).max(50).default('**'),
    APP_VERSION: Joi.string().pattern(/^\d+\.\d+\.\d+$/).default('1.0.0'),
    LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
    CORS_ORIGINS: Joi.string().default('**'),
    RATE_LIMIT_TTL: Joi.number().integer().min(1).max(3600).default(60),
    RATE_LIMIT_MAX: Joi.number().integer().min(1).max(10000).default(100),
    SECURITY_HELMET: Joi.boolean().default(true),
    SECURITY_RATE_LIMIT: Joi.boolean().default(true),
    SECURITY_COMPRESSION: Joi.boolean().default(true),
});

// export application configuration
export default registerAs('app', (): AppConfig => {
    // helper function for safe integer parsing
    const parseIntSafe = (value: string | undefined, defaultValue: number): number => {
        if (!value) return defaultValue;
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? defaultValue : parsed;
    };

    // helper function for safe boolean parsing
    const parseBoolSafe = (value: string | undefined, defaultValue: boolean): boolean => {
        if (!value) return defaultValue;
        return value.toLowerCase() !== 'false';
    };

    return {
        name: process.env.APP_NAME || '**',
        version: process.env.APP_VERSION || '1.0.0',
        port: parseIntSafe(process.env.PORT, 3001),
        environment: process.env.NODE_ENV || 'development',
        logLevel: process.env.LOG_LEVEL || 'info', 
        corsOrigins: (process.env.CORS_ORIGINS || '**').split(',').map(origin => origin.trim()),
        rateLimit: {
            ttl: parseIntSafe(process.env.RATE_LIMIT_TTL, 60),
            limit: parseIntSafe(process.env.RATE_LIMIT_MAX, 100),
        },
        security: {
            helmet: parseBoolSafe(process.env.SECURITY_HELMET, true),
            rateLimit: parseBoolSafe(process.env.SECURITY_RATE_LIMIT, true),
            compression: parseBoolSafe(process.env.SECURITY_COMPRESSION, true),
        },
    };
});


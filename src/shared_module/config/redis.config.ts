// redis connection configuration
import { registerAs } from "@nestjs/config";
import * as Joi from 'joi';

// redis configuration interface
export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    database: number;
    keyPrefix: string;
    ttl: number; // default time to live for cache entries in seconds
    cluster?: boolean;
    sentinels?: Array<{ host: string; port: number }>;
}

// redis sentinel configuration interface
export interface RedisSentinel {
    host: string;
    port: number;
}

// Joi validation schema for redis configuration
export const redisConfigValidation = Joi.object({
    REDIS_HOST: Joi.string().hostname().required(), // must be valid hostname
    REDIS_PORT: Joi.number().integer().min(1000).max(65535).default(6379), // valid port range
    REDIS_PASSWORD: Joi.string().min(1).max(256).optional(), // reasonable password length
    REDIS_DATABASE_NUMBER: Joi.number().integer().min(0).max(15).default(0), // Redis db range
    REDIS_KEY_PREFIX: Joi.string().min(1).max(50).pattern(/^[a-zA-Z0-9_:]+$/).default('**'), // alphanumeric with colon
    REDIS_TTL: Joi.number().integer().min(60).max(2592000).default(3600), // 1min to 30days in seconds
    REDIS_CLUSTER: Joi.boolean().default(false),
    REDIS_SENTINELS: Joi.string().when('REDIS_CLUSTER', {
        is: true,
        then: Joi.required(), // sentinels required when cluster mode is enabled
        otherwise: Joi.optional()
    }),
});

// export redis configuration
export default registerAs('redis', (): RedisConfig => {
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

    // helper function for safe JSON parsing of sentinels
    const parseSentinelsSafe = (sentinelsJson: string | undefined): RedisSentinel[] | undefined => {
        if (!sentinelsJson) return undefined;

        try {
            const parsed = JSON.parse(sentinelsJson);
            if (!Array.isArray(parsed)) {
                console.warn('REDIS_SENTINELS must be a JSON array');
                return undefined;
            }

            // validate each sentinel configuration
            const validSentinels: RedisSentinel[] = parsed.filter((sentinel: unknown): sentinel is RedisSentinel => {
                const s = sentinel as Record<string, unknown>;
                return (
                    typeof s === 'object' &&
                    s !== null &&
                    typeof s.host === 'string' &&
                    typeof s.port === 'number' &&
                    s.port >= 1000 &&
                    s.port <= 65535
                );
            });

            if (validSentinels.length === 0) {
                console.warn('No valid sentinels found in REDIS_SENTINELS');
                return undefined;
            }

            return validSentinels;
        } catch (error) {
            console.warn('Failed to parse REDIS_SENTINELS JSON:', error);
            return undefined;
        }
    };

    const isClusterMode = parseBoolSafe(process.env.REDIS_CLUSTER, false);

    return {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseIntSafe(process.env.REDIS_PORT, 6379),
        password: process.env.REDIS_PASSWORD || undefined,
        database: parseIntSafe(process.env.REDIS_DATABASE_NUMBER, 0),
        keyPrefix: process.env.REDIS_KEY_PREFIX || '**',
        ttl: parseIntSafe(process.env.REDIS_TTL, 3600),
        cluster: isClusterMode,
        sentinels: isClusterMode ? parseSentinelsSafe(process.env.REDIS_SENTINELS) : undefined,
    };
});
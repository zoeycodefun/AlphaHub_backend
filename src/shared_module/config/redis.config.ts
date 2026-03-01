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
    ttl: number; // default time to live for cache entries
    cluster?: boolean;
    sentinels?: Array<{ host: string; port: number}>;
}

// Joi validation schema for redis configuration
export const redisConfigValidation = Joi.object({
    REDIS_HOST: Joi.string().required(),
    REDIS_PORT: Joi.number().default(6379),
    REDIS_PASSWORD: Joi.string().optional(),
    REDIS_DATABASE_NUMBER: Joi.number().default(0),
    REDIS_KEY_PREFIX: Joi.string().default('alphahub:'),
    REDIS_TTL: Joi.number().default(3600),
    REDIS_CLUSTER: Joi.boolean().default(false)
});

// export redis configuration
export default registerAs('redis', (): RedisConfig => ({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    database: parseInt(process.env.REDIS_DATABASE_NUMBER, 10) || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'alphahub:',
    ttl: parseInt(process.env.REDIS_TTL, 10) || 3600,
    // cluster mode configuration
    cluster: process.env.REDIS_CLUSTER === 'true',
    sentinels: process.env.REDIS_SENTINELS ? 
    JSON.parse(process.env.REDIS_SENTINELS) : undefined,

}))
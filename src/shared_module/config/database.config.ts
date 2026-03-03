// postgreSQL and other database connection configuration
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as Joi from 'joi';

// database configuration interface
export interface DatabaseConfig {
    type: 'postgres' | 'mysql';
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl: boolean | object;
    poolSize: number;
    poolMaxIdleTime: number;
    poolMaxLifetime: number;
    synchronize: boolean; // auto synchronize entities with database schema, only for development
    logging: boolean | string[];
    entities: string[]; // entity files path
    migrations: string[]; // migration files path
    subscribers: string[]; // subscriber files path
}

// Joi validation schema for database configuration(type and required fields)
export const databaseConfigValidation = Joi.object({
    DATABASE_TYPE: Joi.string().valid('postgres', 'mysql').default('postgres'),
    DATABASE_HOST: Joi.string().hostname().required(),
    DATABASE_PORT: Joi.number().integer().min(1000).max(65535).default(5432),
    DATABASE_USERNAME: Joi.string().min(1).max(100).required(),
    DATABASE_PASSWORD: Joi.string().min(1).required(),
    DATABASE_NAME: Joi.string().min(1).max(100).required(),
    DATABASE_SSL: Joi.boolean().default(false),
    DATABASE_SSL_CA: Joi.string().when('DATABASE_SSL', { is: true, then: Joi.required() }),
    DATABASE_SSL_CERT: Joi.string().when('DATABASE_SSL', { is: true, then: Joi.required() }),
    DATABASE_SSL_KEY: Joi.string().when('DATABASE_SSL', { is: true, then: Joi.required() }),
    DATABASE_POOL_SIZE: Joi.number().integer().min(1).max(100).default(10),
    DATABASE_POOL_MAX_IDLE_TIME: Joi.number().integer().min(1000).max(300000).default(30000),
    DATABASE_POOL_MAX_LIFETIME: Joi.number().integer().min(60000).max(3600000).default(600000),
    DATABASE_SYNCHRONIZE: Joi.boolean().default(false),
    REDIS_HOST: Joi.string().hostname().when('NODE_ENV', { is: 'production', then: Joi.required() }),
    REDIS_PORT: Joi.number().integer().min(1000).max(65535).default(6379),
    REDIS_PASSWORD: Joi.string(),
    REDIS_DATABASE_NUMBER: Joi.number().integer().min(0).max(15).default(0),
    REDIS_TTL: Joi.number().integer().min(60).max(86400).default(3600),
});

//
export default registerAs('database', (): TypeOrmModuleOptions & DatabaseConfig => {
    const isProduction = process.env.NODE_ENV === 'production';
    const isDevelopment = process.env.NODE_ENV === 'development';

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

    return {
        type: (process.env.DATABASE_TYPE as 'postgres') || 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseIntSafe(process.env.DATABASE_PORT, 5432),
        username: process.env.DATABASE_USERNAME || '',
        password: process.env.DATABASE_PASSWORD || '',
        database: process.env.DATABASE_NAME || '',

        // SSL configuration - must be enabled in production for security
        ssl: parseBoolSafe(process.env.DATABASE_SSL, false) ? {
            rejectUnauthorized: isProduction, // production should use trusted certificates
            ca: process.env.DATABASE_SSL_CA,
            cert: process.env.DATABASE_SSL_CERT,
            key: process.env.DATABASE_SSL_KEY,
        } : false,

        // connection pool configuration
        extra: {
            max: parseIntSafe(process.env.DATABASE_POOL_SIZE, 10),
            min: 2,
            idleTimeoutMillis: parseIntSafe(process.env.DATABASE_POOL_MAX_IDLE_TIME, 30000),
            acquireTimeoutMillis: 60000,
            evictCheckIntervalMillis: 10000,
            handleTimeoutMillis: 60000,
            reapIntervalMillis: 1000,
            createTimeoutMillis: 30000,
            destroyTimeoutMillis: 5000,
            maxLifetime: parseIntSafe(process.env.DATABASE_POOL_MAX_LIFETIME, 600000),
        },
        // entities, migrations, subscribers path configuration
        entities: ['dist/**/*.entity{.ts,.js'],
        migrations: ['dist/migrations/*{.ts,.js'],
        subscribers: ['dist/**/*.subscriber{.ts,.js'],
        // additional DatabaseConfig interface properties
        poolSize: parseIntSafe(process.env.DATABASE_POOL_SIZE, 10),
        poolMaxIdleTime: parseIntSafe(process.env.DATABASE_POOL_MAX_IDLE_TIME, 30000),
        poolMaxLifetime: parseIntSafe(process.env.DATABASE_POOL_MAX_LIFETIME, 600000),
        // auto synchronize entities with database schema, only for development environment
        synchronize: isDevelopment && parseBoolSafe(process.env.DATABASE_SYNCHRONIZE, false),
        
        // SQL logging configuration, only for development environment(production environment just return error logs)
        logging: isDevelopment ? ['query', 'error', 'warn'] : ['error'],

        // redis configuration for query result caching
        cache: {
            type: 'redis',
            options: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseIntSafe(process.env.REDIS_PORT, 6379),
                password: process.env.REDIS_PASSWORD,
                db: parseIntSafe(process.env.REDIS_DATABASE_NUMBER, 0),
            },
            duration: parseIntSafe(process.env.REDIS_TTL, 3600) * 1000,
        },
        // production environment optimizations and security settings
        ...(isProduction && {
            dropSchema: false, // never drop schema in production
            synchronize: false, // never auto-sync in production, use migrations
            keepConnectionAlive: true, // maintain persistent connections for performance
            retryAttempts: 5, // connection retry attempts
            retryDelay: 3000, // retry delay in milliseconds
        }),
    };
});
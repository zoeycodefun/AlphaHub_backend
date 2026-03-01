// postgreSQL and other database connection configuration
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as Joi from 'joi';

// database configuration interface
export interface DatabaseConfig {
    type: 'postgre' | 'mysql'; // extendible
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl: boolean;
    poolSize: number;
    poolMaxIdleTime: number;
    poolMaxLifetime: number;
    synchronize: boolean; // auto synchronize entities with database schema, only for development
    logging: boolean;
    entities: string[]; // entity files path
    migrations: string[]; // migration files path
    subscribers: string[]; // subscriber files path
}

// Joi validation schema for database configuration(type and required fields)
export const databaseConfigValidation = Joi.object({
    DATABASE_TYPE: Joi.string().valid('postgres', 'mysql').default('postgres'),
    DATABASE_HOST: Joi.string().required(),
    DATABASE_PORT: Joi.number().default(5432),
    DATABASE_USERNAME: Joi.string().required(),
    DATABASE_PASSWORD: Joi.string().required(),
    DATABASE_NAME: Joi.string().required(),
    DATABASE_SSL: Joi.boolean().default(false),
    DATABASE_POOL_SIZE: Joi.number().default(10),
    DATABASE_POOL_MAX_IDLE_TIME: Joi.number().default(30000),
    DATABASE_POOL_MAX_LIFETIME: Joi.number().default(600000),
});

//
export default registerAs('database', (): TypeOrmModuleOptions & DatabaseConfig => {
    const isProduction = process.env.NODE_ENV === 'production';
    const isDevelopment = process.env.NODE_ENV === 'development';

    return {
        type: (process.env.DATABASE_TYPE as 'postgres') || 'postgres',
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,

        // SSL configuration(must open in production environment)
        ssl: process.env.DATABASE_SSL === 'true' ? {
            rejectUnauthorized: false, // ❌生产环境使用受信任的证书并将此项设置为生产模式为true
            ca: process.env.DATABASE_SSL_CA,
            cert: process.env.DATABASE_SSL_CERT,
            key: process.env.DATABASE_SSL_KEY,
        }: false,

        // connect pool configuration
        extra: {
            max: parseInt(process.env.DATABASE_POOL_SIZE,10) || 10,
            min: 2,
            idleTimeoutMillis: parseInt(process.env.DATABASE_POOL_MAX_IDLE_TIME, 10) || 30000, // max idle time before releasing connection
            acquireTimeoutMillis: 60000, // acquire connection timeout time
            evictCheckIntervalMillis: 10000, // clean spare connections interval time
            handleTimeoutMillis: 60000, // handle timeout time
            reapIntervalMillis: 1000, // recycle idle connections interval time
            createTimeoutMillis: 30000, // create connection timeout time
            destoryTimeoutMillis: 5000, // destroy connection timeout time
            maxLifetime: parseInt(process.env.DATABASE_POOL_MAX_LIFETIME, 10) || 600000, // max lifetime of a connection
        },
        // entities, migrations, subscribers path configuration
        entities: ['dist/**/*.entity{.ts,.js'],
        migrations: ['dist/migrations/*{.ts,.js'],
        subscribers: ['dist/**/*.subscriber{.ts,.js'],

        // auto synchronize entities with database schema, only for development environment, production environment must use migration to update database schema
        synchronize: isDevelopment && process.env.DATABASE_SYNCHRONIZE !== 'false',
        
        // SQL logging configuration, only for development environment(production environment just return error logs)
        logging: isDevelopment ? ['query', 'error', 'warn'] : ['error'],

        // redis configuration
        cache: {
            type: 'redis',
            options: {
                host: process.env.REDIS_HOST,
                port: parseInt(process.env.REDIS_PORT, 10),
                password: process.env.REDIS_PASSWORD,
                database: parseInt(process.env.REDIS_DATABASE_NUMBER, 10) || 0,
            },
            duration: parseInt(process.env.REDIS_TTL, 10) * 1000 || 3600000, // cache duration time in milliseconds
        },
        // optimized params for production environment
        ...(isProduction && {
            dropSchema: false, // ❌生产环境禁止自动删除数据库表
            synchronize: false, // ❌生产环境禁止自动同步数据库表结构，必须使用迁移文件更新数据库表结构
            keepConnectionAlive: true, // 生产环境保持数据库连接，避免频繁连接和断开导致性能问题
            retryAttempts: 5, // 连接失败重试次数
            retryDelay: 3000, // 连接失败重试间隔时间
        }),
    };
});
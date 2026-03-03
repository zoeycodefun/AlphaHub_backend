// Redis cache service: provide a united interface for caching data in Redis, support session management, data cache
// based on ioredis client
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common"; // life cycle hooks for managing Redis connection and logger
import { ConfigService } from "@nestjs/config";
import Redis from 'ioredis';

/**
 * Cache key prefix enumeration
 *
 * Defines standardized prefixes for different types of cached data to prevent
 * key collisions and improve cache organization.
 */
export enum CacheKeyPrefix {
    USER_SESSION = 'user:session:',
    USER_PROFILE = 'user:profile:',
    MARKET_DATA = 'market:data:',
    API_RESPONSE = 'api:response:',
    RATE_LIMIT = 'rate:limit:',
}

/**
 * Cache expiration time constants
 *
 * Defines TTL values for different cache types to ensure proper data freshness
 * and automatic cleanup of stale data.
 */
export const CACHE_TTL = {
    USER_SESSION: 24 * 60 * 60, // 24 hours
    USER_PROFILE: 60 * 60, // 1 hour
    MARKET_DATA: 5 * 60, // 5 minutes
    API_RESPONSE: 10 * 60, // 10 minutes
    RATE_LIMIT: 60, // 1 minute
} as const;

/**
 * Session data interface
 *
 * Defines the structure for user session data stored in cache.
 * Contains essential information for session management and can be extended as needed.
 */
export interface SessionData {
    userId: string;
    email: string;
    username: string;
    lastActivityTime: number;
    ipAddress?: string;
    userAgent?: string;
    isActive: boolean;
}

/**
 * Cache service configuration interface
 *
 * Defines the required configuration parameters for Redis connection.
 */
interface CacheServiceConfig {
    host: string;
    port: number;
    password?: string;
    db: number;
}

/**
 * Redis Cache Service
 *
 * Provides a unified, type-safe interface for Redis caching operations including
 * session management, data caching, and connection lifecycle management.
 *
 * Key features:
 * - Type-safe generic caching methods
 * - Comprehensive session management
 * - Automatic connection handling with lifecycle hooks
 * - Robust error handling and logging
 * - Configurable TTL for different data types
 * - Health check capabilities
 */
@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(CacheService.name);
    private redisClient: Redis;

    /**
     * Constructor with dependency injection
     *
     * @param configService - NestJS config service for environment variables
     */
    constructor(private readonly configService: ConfigService) {}

    /**
     * Initialize Redis client on module startup
     *
     * Establishes Redis connection with proper configuration and event handling.
     * Throws error if connection fails to prevent application startup with broken cache.
     */
    async onModuleInit(): Promise<void> {
        try {
            // Retrieve Redis configuration from environment
            const config: CacheServiceConfig = {
                host: this.configService.get<string>('REDIS_HOST') || 'localhost',
                port: this.configService.get<number>('REDIS_PORT') || 6379,
                password: this.configService.get<string>('REDIS_PASSWORD'),
                db: this.configService.get<number>('REDIS_DATABASE_NUMBER') || 0,
            };

            // Create Redis client instance
            this.redisClient = new Redis({
                host: config.host,
                port: config.port,
                password: config.password,
                db: config.db,
                // Additional connection options for reliability
                maxRetriesPerRequest: 3,
                lazyConnect: true,
                enableReadyCheck: false,
            });

            // Set up connection event handlers
            this.redisClient.on('connect', () => {
                this.logger.log('Connected to Redis server successfully');
            });

            this.redisClient.on('error', (error: Error) => {
                this.logger.error(`Redis connection error: ${error.message}`, error.stack);
            });

            this.redisClient.on('ready', () => {
                this.logger.log('Redis client is ready to use');
            });

            this.redisClient.on('close', () => {
                this.logger.warn('Redis connection closed');
            });

            // Establish connection
            await this.redisClient.connect();
        } catch (error) {
            this.logger.error(`Failed to initialize Redis connection: ${(error as Error).message}`, (error as Error).stack);
            throw error;
        }
    }

    /**
     * Clean up Redis connection on module shutdown
     *
     * Properly closes Redis connection to prevent resource leaks.
     */
    async onModuleDestroy(): Promise<void> {
        try {
            if (this.redisClient && this.redisClient.status !== 'end') {
                await this.redisClient.quit();
                this.logger.log('Disconnected from Redis server successfully');
            }
        } catch (error) {
            this.logger.error(`Failed to disconnect from Redis: ${(error as Error).message}`, (error as Error).stack);
        }
    }

    /**
     * Set cache value with optional TTL
     *
     * Serializes value to JSON and stores in Redis with optional expiration.
     *
     * @param key - Cache key
     * @param value - Value to cache (must be JSON serializable)
     * @param ttl - Time to live in seconds (optional)
     * @throws Error if serialization or Redis operation fails
     */
    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        try {
            const serializedValue = JSON.stringify(value);
            if (ttl && ttl > 0) {
                await this.redisClient.setex(key, ttl, serializedValue);
            } else {
                await this.redisClient.set(key, serializedValue);
            }
        } catch (error) {
            this.logger.error(`Failed to set cache for key "${key}": ${(error as Error).message}`, (error as Error).stack);
            throw error;
        }
    }

    /**
     * Get cache value
     *
     * Retrieves and deserializes cached value from Redis.
     *
     * @param key - Cache key
     * @returns Cached value or null if not found or error occurs
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await this.redisClient.get(key);
            if (!value) {
                return null;
            }
            return JSON.parse(value) as T;
        } catch (error) {
            this.logger.error(`Failed to get cache for key "${key}": ${(error as Error).message}`, (error as Error).stack);
            return null;
        }
    }

    /**
     * Delete cache key
     *
     * Removes specified key from cache.
     *
     * @param key - Cache key to delete
     * @returns Number of keys deleted (0 or 1)
     */
    async delete(key: string): Promise<number> {
        try {
            return await this.redisClient.del(key);
        } catch (error) {
            this.logger.error(`Failed to delete cache for key "${key}": ${(error as Error).message}`, (error as Error).stack);
            return 0;
        }
    }

    /**
     * Check if cache key exists
     *
     * @param key - Cache key to check
     * @returns True if key exists, false otherwise
     */
    async exists(key: string): Promise<boolean> {
        try {
            const result = await this.redisClient.exists(key);
            return result === 1;
        } catch (error) {
            this.logger.error(`Failed to check cache existence for key "${key}": ${(error as Error).message}`, (error as Error).stack);
            return false;
        }
    }

    /**
     * Set expiration time for cache key
     *
     * @param key - Cache key
     * @param ttl - Expiration time in seconds
     * @returns True if expiration was set successfully
     */
    async expire(key: string, ttl: number): Promise<boolean> {
        try {
            const result = await this.redisClient.expire(key, ttl);
            return result === 1;
        } catch (error) {
            this.logger.error(`Failed to set cache expiration for key "${key}": ${(error as Error).message}`, (error as Error).stack);
            return false;
        }
    }

    /**
     * Get time to live for cache key
     *
     * @param key - Cache key
     * @returns TTL in seconds, -2 if key doesn't exist, -1 if no expiration
     */
    async ttl(key: string): Promise<number> {
        try {
            return await this.redisClient.ttl(key);
        } catch (error) {
            this.logger.error(`Failed to get cache TTL for key "${key}": ${(error as Error).message}`, (error as Error).stack);
            return -2;
        }
    }

    // ================================ Session Management Methods ================================

    /**
     * Save user session data
     *
     * @param sessionId - Unique session identifier
     * @param sessionData - Session data to store
     */
    async setUserSession(sessionId: string, sessionData: SessionData): Promise<void> {
        const key = `${CacheKeyPrefix.USER_SESSION}${sessionId}`;
        await this.set(key, sessionData, CACHE_TTL.USER_SESSION);
    }

    /**
     * Retrieve user session data
     *
     * @param sessionId - Session identifier
     * @returns Session data or null if not found
     */
    async getUserSession(sessionId: string): Promise<SessionData | null> {
        const key = `${CacheKeyPrefix.USER_SESSION}${sessionId}`;
        return await this.get<SessionData>(key);
    }

    /**
     * Delete user session
     *
     * @param sessionId - Session identifier to delete
     */
    async deleteUserSession(sessionId: string): Promise<void> {
        const key = `${CacheKeyPrefix.USER_SESSION}${sessionId}`;
        await this.delete(key);
    }

    /**
     * Update user session activity timestamp
     *
     * @param sessionId - Session identifier
     */
    async updateUserActivityTime(sessionId: string): Promise<void> {
        const session = await this.getUserSession(sessionId);
        if (session) {
            session.lastActivityTime = Date.now();
            await this.setUserSession(sessionId, session);
        }
    }

    /**
     * Get all active user sessions
     *
     * Note: This implementation uses KEYS command which may not be suitable
     * for production with large datasets. Consider using Redis sets for better performance.
     *
     * @returns Array of active session data
     */
    async getActiveSessions(): Promise<SessionData[]> {
        try {
            const keys = await this.redisClient.keys(`${CacheKeyPrefix.USER_SESSION}*`);
            const sessions: SessionData[] = [];

            // Process sessions in batches to avoid blocking
            const batchSize = 10;
            for (let i = 0; i < keys.length; i += batchSize) {
                const batchKeys = keys.slice(i, i + batchSize);
                const batchPromises = batchKeys.map(key => this.get<SessionData>(key));
                const batchResults = await Promise.all(batchPromises);

                for (const session of batchResults) {
                    if (session && session.isActive) {
                        sessions.push(session);
                    }
                }
            }

            return sessions;
        } catch (error) {
            this.logger.error(`Failed to get active sessions: ${(error as Error).message}`, (error as Error).stack);
            return [];
        }
    }

    /**
     * Clean up expired sessions
     *
     * Redis automatically handles expiration, this method provides logging
     * for monitoring purposes.
     */
    async cleanupExpiredSessions(): Promise<void> {
        try {
            this.logger.log('Expired sessions cleanup initiated - Redis handles automatic expiration');
            // Could implement manual cleanup logic here if needed
        } catch (error) {
            this.logger.error(`Failed to cleanup expired sessions: ${(error as Error).message}`, (error as Error).stack);
        }
    }

    // ================================ Universal Cache Methods ================================

    /**
     * Cache API response with parameters
     *
     * @param endpoint - API endpoint identifier
     * @param params - Request parameters object
     * @param response - Response data to cache
     * @param ttl - Cache TTL in seconds (default: API_RESPONSE)
     */
    async cacheApiResponse<T>(
        endpoint: string,
        params: Record<string, unknown>,
        response: T,
        ttl = CACHE_TTL.API_RESPONSE
    ): Promise<void> {
        const key = `${CacheKeyPrefix.API_RESPONSE}${endpoint}:${JSON.stringify(params)}`;
        await this.set(key, response, ttl);
    }

    /**
     * Get cached API response
     *
     * @param endpoint - API endpoint identifier
     * @param params - Request parameters object
     * @returns Cached response data or null
     */
    async getCachedApiResponse<T>(endpoint: string, params: Record<string, unknown>): Promise<T | null> {
        const key = `${CacheKeyPrefix.API_RESPONSE}${endpoint}:${JSON.stringify(params)}`;
        return await this.get<T>(key);
    }

    /**
     * Perform Redis health check
     *
     * @returns True if Redis connection is healthy
     */
    async healthCheck(): Promise<boolean> {
        try {
            const pong = await this.redisClient.ping();
            return pong === 'PONG';
        } catch (error) {
            this.logger.error(`Redis health check failed: ${(error as Error).message}`, (error as Error).stack);
            return false;
        }
    }
}

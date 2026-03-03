import { ConfigModuleOptions } from "@nestjs/config";
import * as Joi from 'joi';

// import all configuration modules and their validation schemas
import databaseConfig, { databaseConfigValidation } from './database.config';
import redisConfig, { redisConfigValidation } from "./redis.config";
import appConfig, { appConfigValidation } from "./app.config";
import exchangesConfig, { exchangeConfigValidation } from "./exchanges.config";

// configuration validation options interface
export interface ConfigValidationOptions {
    allowUnknown: boolean;
    abortEarly: boolean;
    stripUnknown?: boolean;
}

// combined configuration interface
export interface CombinedConfig {
    database: ReturnType<typeof databaseConfig>;
    redis: ReturnType<typeof redisConfig>;
    app: ReturnType<typeof appConfig>;
    exchanges: ReturnType<typeof exchangesConfig>;
}
// combine all configuration validation schemas
// note: Joi schema concatenation ensures proper validation inheritance
export const configValidationSchema = Joi.object({})
    .concat(databaseConfigValidation)
    .concat(redisConfigValidation)
    .concat(appConfigValidation)
    .concat(exchangeConfigValidation);
// configuration validation options with detailed error handling
export const configValidationOptions: ConfigValidationOptions = {
    allowUnknown: true, // allow unknown environment variables for flexibility
    abortEarly: false, // collect all validation errors instead of stopping at first error
    stripUnknown: false, // keep unknown properties for debugging
};

// environment-specific configuration options
const getEnvSpecificOptions = (): Partial<ConfigModuleOptions> => {
    const isProduction = process.env.NODE_ENV === 'production';
    const isTest = process.env.NODE_ENV === 'test';

    if (isTest) {
        return {
            ignoreEnvFile: true, // don't load .env files in test environment
            cache: false, // disable caching in tests for consistency
        };
    }

    if (isProduction) {
        return {
            ignoreEnvFile: true, // don't load .env files in production (use system env vars)
            cache: true, // enable caching for performance
        };
    }

    // development environment
    return {
        envFilePath: ['.env.local', '.env'], // load local env files first
        cache: true,
    };
};

// export configuration options for ConfigModule
export const configOptions: ConfigModuleOptions = {
    isGlobal: true, // make configuration available globally
    load: [databaseConfig, redisConfig, appConfig, exchangesConfig],
    validationSchema: configValidationSchema,
    validationOptions: configValidationOptions,
    cache: true,
    expandVariables: true, // enable variable expansion in env values
    ...getEnvSpecificOptions(), // merge environment-specific options
};

// re-export individual configurations for direct access
export {
    databaseConfig,
    redisConfig,
    appConfig,
    exchangesConfig,
};

// re-export validation schemas for testing or custom validation
export {
    databaseConfigValidation,
    redisConfigValidation,
    appConfigValidation,
    exchangeConfigValidation,
};

// utility function to validate configuration at runtime
export const validateConfiguration = (config: Record<string, any>): void => {
    const { error } = configValidationSchema.validate(config, configValidationOptions);

    if (error) {
        const errorMessages = error.details.map(detail => detail.message).join('\n');
        throw new Error(`Configuration validation failed:\n${errorMessages}`);
    }
};

// utility function to get current environment
export const getCurrentEnvironment = (): string => {
    return process.env.NODE_ENV || 'development';
};

// utility function to check if running in production
export const isProduction = (): boolean => {
    return getCurrentEnvironment() === 'production';
};

// utility function to check if running in development
export const isDevelopment = (): boolean => {
    return getCurrentEnvironment() === 'development';
};

// utility function to check if running in test environment
export const isTest = (): boolean => {
    return getCurrentEnvironment() === 'test';
};

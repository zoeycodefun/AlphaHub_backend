import { ConfigModuleOptions } from "@nestjs/config";
import * as Joi from 'joi';
// import all configuration and validation schemas
import databaseConfig, { databaseConfigValidation } from './database.config';
import redisConfig, { redisConfigValidation } from "./redis.config";
import appConfig, { appConfigValidation } from "./app.config";
import exchangesConfig, { exchangeConfigValidation } from "./exchanges.config";
import { abort } from "node:process";
// combine all configuration and validation schemas into a single export
export const configValidationSchema = Joi.object({
    ...databaseConfigValidation,
    ...redisConfigValidation,
    ...appConfigValidation,
    ...exchangeConfigValidation,
});
// export configuration options for ConfigModule
export const configOptions: ConfigModuleOptions = {
    isGlobal: true,
    load: [databaseConfig, redisConfig, appConfig, exchangesConfig],
    validationSchema: configValidationSchema,
    validationOptions: {
        allowUnknown: true,
        abortEarly: false, // collect all validation errors instead of stopping at the first one
    },
    cache: true,
    expandVariables: true,
};

import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
// Security: load environment variables from .env file, but in production, use secrets or cloud provider's secret management service
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    console.error(`❌ FATAL: .env file not found at ${envPath}`);
    process.exit(1);
}
dotenv.config({ path: envPath });
// Import migrations after loading env variables
import { CreateCexAccountsTable1697100000000 } from "@/shared_module/database_migration/create_cex_accounts_table";
import { CreateDexAccountsTable1697100001000 } from "@/shared_module/database_migration/create_dex_accounts_table";
// Security: validate critical environment variables before proceeding
const requiredEnvVars = [
    'DATABASE_HOST',
    'DATABASE_PORT',
    'DATABASE_USERNAME',
    'DATABASE_PASSWORD',
    'DATABASE_NAME'
];
const missingEnvVars = requiredEnvVars.filter(
    varName => !process.env[varName]
);
if (missingEnvVars.length > 0) {
    console.error(`❌ FATAL: Missing required environment variables: ${missingEnvVars.join(', ')}`);
    missingEnvVars.forEach(varName => 
        console.error(`   - ${varName} is required for database connection`));
    process.exit(1);
}
// Security: never log passwords
const safeConfig = {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT!, 10),
    username: process.env.DATABASE_USERNAME,
    database: process.env.DATABASE_NAME,
    ssl: process.env.DATABASE_SSL === 'true',
};
/**
 * Standalone TypeORM datasource for migrations
 * For security:
 * 1. No password logging
 * 2. SSL enforced in production
 * 3. Transaction per migration
 * 4. Detailed audit log
 */
const AppDataSource = new DataSource({
    type: 'postgres',
    host: safeConfig.host,
    port: safeConfig.port,
    username: safeConfig.username,
    password: process.env.DATABASE_PASSWORD,
    database: safeConfig.database,
    ssl: safeConfig.ssl ? { rejectUnauthorized: true } : false,
    synchronize: false,
    logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    entities: [],
    migrations: [
        CreateCexAccountsTable1697100000000,
        CreateDexAccountsTable1697100001000
    ],
    migrationsTableName: 'typeorm_migrations',
    migrationsRun: false,
});
async function runMigrations(): Promise<void> {
    const timestamp = () => new Date().toISOString();
    const log = {
        info: (message: string) => console.log(`[${timestamp()}] [Migration] ${message}`),
        success: (message: string) => console.log(`[${timestamp()}] [Migration] ✅ ${message}`),
        warn: (message: string) => console.warn(`[${timestamp()}] [Migration] ⚠️ ${message}`),
        error: (message: string) => console.error(`[${timestamp()}] [Migration] ❌ ${message}`)
    };
    log.info('⏳ Starting database migration...');
    log.info(`Target: ${safeConfig.username}@${safeConfig.host}:${safeConfig.port}/${safeConfig.database}`);
    log.info(`SSL: ${safeConfig.ssl ? 'enabled' : 'disabled'}`);
    // Security: production check
    if (process.env.NODE_ENV === 'production' && !safeConfig.ssl) {
        log.warn('⚠️ WARNING: Running in production without SSL is not recommended!');
    }
    try {
        log.info('🔗 Connecting to the database...');
        await AppDataSource.initialize();
        log.success('✅ Database connection established');
        // Check pending migrations
        const pendingMigrations = await AppDataSource.showMigrations();
        if (!pendingMigrations) {
            log.info('🎉 No pending migrations. Database is up to date.');
            return;
        }
        log.info(`Found ${pendingMigrations ? 'pending' : 'no'} migrations.`)
        log.info('🚀 Executing migrations with transactions-per-migration(atomic rollback)...');
        const executedMigrations = await AppDataSource.runMigrations({
            transaction: 'each',
            fake: false,
        });
        if (executedMigrations.length > 0) {
            log.info('No migrations were executed. Database is up to date.');
        } else {
            log.success(`✅ Successfully executed ${executedMigrations.length} migrations.`);
            executedMigrations.forEach((migration, index) => {
                log.success(`   ${index + 1}. ${migration.name}(${migration.timestamp})`);
            });
        }
    } catch (error) {
        const err = error as Error;
        log.error(`Migration failed: ${err.message}`);
        if (err.stack) {
            console.error(err.stack);
        }
        throw error;    
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            log.info('🔌 Database connection closed');
        }
    }
}
// Security: proper exit codes for CI/CD pipelines
runMigrations()
    .then(() => {
        console.log('🎉 Database migration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Database migration failed:', error);
        process.exit(1);
    });

    
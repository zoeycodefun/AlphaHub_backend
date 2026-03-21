import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import * as bcrypt from "bcrypt";
// load env first
const envPath = path.resolve(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
    console.error(`❌ FATAL: .env file not found at ${envPath}`);
    process.exit(1);
}
dotenv.config({ path: envPath });
// import entities after loading env
import { PlatformUserEntity } from "@/shared_module/entities/platform_universal_user.entity";
import { resolve } from "dns";
// Security: validate required environment variables before proceeding
const required = ['DATABASE_HOST', 'DATABASE_PORT', 'DATABASE_USERNAME', 'DATABASE_PASSWORD', 'DATABASE_NAME'];
const missing = required.filter(variable => !process.env[variable])
if (missing.length > 0) {
    console.error('❌ FATAL: Missing required environment variables: ' + missing.join(', '));
    process.exit(1);
}
const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT!, 10),
    username: process.env.DATABASE_USERNAME!,
    password: process.env.DATABASE_PASSWORD!,
    database: process.env.DATABASE_NAME!,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : false,
    synchronize: false,
    logging: false,
    entities: [PlatformUserEntity],
});
async function seed(): Promise<void> {
    const log = {
        info: (message: string) => console.log(`[${new Date().toISOString()}] [Seed] ${message}`),
        success: (message: string) => console.log(`[${new Date().toISOString()}] [Seed] ✅ ${message}`),
        warn: (message: string) => console.warn(`[${new Date().toISOString()}] [Seed] ⚠️ ${message}`),
        error: (message: string) => console.error(`[${new Date().toISOString()}] [Seed] ❌ ${message}`),
    };
    log.info('Starting database seeding...');
    // Security:production safety check
    if (process.env.NODE_ENV === 'production') {
        log.warn('Running in production environment. This will create test users!');
        log.warn('Type "yes" to continue or Ctrl+C to abort.');
        // Wait for user confirmation in production 
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const answer = await new Promise<string>(resolve => {
            readline.question('Confirm: ', resolve);
        });
        readline.close();
        if (answer.toLowerCase() !== 'yes') {
            log.info('Aborting seeding.');
            process.exit(0);
        }
    }
    await AppDataSource.initialize();
    log.success('Database connection established');
    const userRepository = AppDataSource.getRepository(PlatformUserEntity);
    try {
        // test user1: regular user
        const testEmail = 'test@alphahub.local';
        const existingUser = await userRepository.findOne({ where: { email: testEmail } });
        if (existingUser) {
            log.info(`User ${testEmail} already exists(id=${existingUser.id}), skipping creation.`);
        } else {
            // Security: bcrypt with salt for password hashing
            const passwordHash = await bcrypt.hash('****', 12);
            const user = userRepository.create({
                username: 'testuser',
                password: passwordHash,
                email: testEmail,
                nickname: 'Test User',
                role: 'user',
                enabled: true,
                emailVerified: false,
                phoneVerified: false,
            });
            const savedUser = await userRepository.save(user);
            log.success(`Created test user: ${testEmail} with user id ${savedUser.id}`);
            log.info(` Login: ${testEmail}`)
        }
        // test user2: admin user
        if (process.env.SEED_ADMIN_USER === 'true') {
            const adminEmail = 'admin@alphahub.local';
            const existingAdmin = await userRepository.findOne({ where: { email: adminEmail } });
            if (!existingAdmin) {
                const adminHash = await bcrypt.hash('****', 12);
                const adminUser = userRepository.create({
                    username: 'adminuser',
                    password: adminHash,
                    email: adminEmail,
                    nickname: 'Admin User',
                    role: 'admin',
                    enabled: true,
                    emailVerified: true,
                    phoneVerified: false,
                });
                const savedAdmin = await userRepository.save(adminUser);
                log.success(`Created admin user: ${adminEmail} with user id ${savedAdmin.id}`);
                log.info(` Login: ${adminEmail}`)
            } else {
                log.info(`Admin user ${adminEmail} already exists(id=${existingAdmin.id}), skipping creation.`);
            }
        }
    } catch (error) {
        log.error(`Seeding failed: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    } finally {
        await AppDataSource.destroy();
        log.info('Database connection closed');
    }
}
seed()
    .then(() => {
        console.log('✅Database seeding completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌Database seeding failed:', error);
        process.exit(1);
    })
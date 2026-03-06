// Encryption service for exchanges accounts and other accounts: offer services for API secret keys encryption and decryption, and for password hashing and verification
// Use AES-256-GCM encryption algorithm and PBKDF2 key derivation function for secure encryption and hashing
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

/**
 * encryption config interface
 */
interface EncryptionConfig {
    algorithm: string;
    keyLength: number;
    // initialization vector length for AES-GCM
    ivLength: number;
    // PBKDF2 iterations for key derivation
    saltRounds: number;
    // GCM authentication tag length
    tagLength: number;
}
/**
 * Encrypted data structure
 * including encrypted data and relevant metadata
 */
interface EncryptedData {
    // base64 encoded encrypted data
    encrypted_data: string;
    // salt rounds used for key derivation(base64 encoded)
    salt_rounds: string;
    // initialization verctor(base64 encoded)
    iv: string;
    // authentication tag for AES-GCM(base64 encoded)
    tag: string;
}
/**
 * Accounts encryption service: offer services for exchanges accounts API secret keys encryption, storage and decryption
 * use AES-256-GCM encryption algorithm and PBKDF2 key derivation for security
 * function: API secret keys encryption and decryption, password hashing and verification
 * security characteristics: AES-256-GCM symmetric encryption, PBKDF2 key derivation, random salt and IV, GCM authentication tag, error handling
 */
@Injectable()
export class AccountsEncryptionService {
    private readonly logger = new Logger(AccountsEncryptionService.name);
    // constrants for encryption config
    private readonly config: EncryptionConfig = {
        algorithm: 'aes-256-gcm',
        keyLength: 32,
        ivLength: 16,
        saltRounds: 10000,
        tagLength: 16,
    };
    // main master key(must get from environment variable for security)
    private readonly masterKey: string;
    /**
     * constructor function
     * initialization with encryption services, validate necessary environment variables and configuration
     * 
     * @param configService NestJS config service
     * @throws Error if environment variables are missing or configuration is invalid
     */
    constructor(private readonly configService: ConfigService) {
        // get master key from env
        this.masterKey = this.configService.get<string>('ENCRYPTION_MASTER_KEY');
        // validate master key enistence and length
        if (!this.masterKey || this.masterKey.length < 32) {
            throw new Error('ENCRYPTION_MASTER_KEY environment variable is required and must be at least 32 characters long');
        }
        this.logger.log('Accounts encryption service initialized successfully');
    }
    /**
     * Encrypt API secret keys
     * use AES-256-GCM encryption algorithm: 
     * 1. generate random salt and IV
     * 2. use PBKDF2 derive encryption 
     * 3. encrypt data and generate authentication tag
     * 4. return encrypted data and metadata as base64 encoded string
     * @param apiKey API secret key wait to be encrypted
     * @returns base64 encoded encrypted data and metadata
     * @throws Error if encryption process fails
     */
    async encryptApiSecret(apiKey: string): Promise<string> {
        try {
            // validate input params
            if (!apiKey || typeof apiKey !== 'string') {
                throw new Error('Invalid API key: must be a non-empty string');
            }
            // generate random salt and IV
            const salt = crypto.randomBytes(32); // 32 bytes salt for PBKDF2
            // use PBKDF2 derive encryption key from master key and salt
            // params: password, master key, iterations, key length, hash algorithm
            const key = crypto.pbkdf2Sync(
                this.masterKey,
                salt,
                this.config.saltRounds,
                this.config.keyLength,
                'sha256' // hash algorithm for PBKDF2
            );
            // generate random IV for AES-GCM(16 bytes)
            const iv = crypto.randomBytes(this.config.ivLength);
            // create cipher
            const cipher = crypto.createCipheriv(this.config.algorithm, key, iv) as crypto.CipherGCM;

            // set additional auth data--used for the verification of GCM completeness
            cipher.setAAD(Buffer.from('api-key'));

            // encrypt data
            let encrypted_data = cipher.update(apiKey, 'utf8', 'hex');
            encrypted_data += cipher.final('hex');

            // get authentication tag for AES-GCM, used for verifying data completeness and integrity
            const tag = cipher.getAuthTag();

            // combine encrypted data: salt(32) + iv(16) + tag(16) + encrypted data
            const result = Buffer.concat([
                salt,
                iv,
                tag,
                Buffer.from(encrypted_data, 'hex'),
            ]);
            return result.toString('base64');
        } catch (error) {
            this.logger.error('Failed to encrypt API secret key', {
                error: (error as Error).message,
                stack: (error as Error).stack
            });
            throw new Error('Failed to encrypt API secret key: encryption process failed');
        }
    }
    /**
     * decryption API secret keys
     * use AES-256-GCM algorithm to decrypt encrypted API secret keys:
     * 1. base64 decode crypted data
     * 2. extract salt, IV, tag and encrypted data
     * 3. use PBKDF2 re-derive decryption key
     * 4. decrypt data and verrify completeness of data
     * @param encryptedData base64 encoded encrypted data and metadata
     * @returns decrypted API secret key
     * @throws Error if decryption process fails or data is tampered
     */
    async decryptApiKey(encryptedData: string): Promise<string> {
        try {
            // validate input params
            if (!encryptedData || typeof encryptedData !== 'string') {
                throw new Error('Encrypted data must be a non-empty string');
            }
            // base64 decode encrypted data
            const data = Buffer.from(encryptedData, 'base64');
            if (data.length < 64) {
                throw new Error('Invalid encrypted data format');
            }
            // extract encrypted data components: salt(32) + iv(16) + tag(16) + encrypted data
            const salt = data.subarray(0, 32);
            const iv = data.subarray(32, 48);
            const tag = data.subarray(48, 64);
            const encrypted_data = data.subarray(64);
            // use PBKDF2 re-derive decryption key
            const key = crypto.pbkdf2Sync(
                this.masterKey,
                salt,
                this.config.saltRounds,
                this.config.keyLength,
                'sha256'
            );
            // create decipher
            const decipher = crypto.createDecipheriv(this.config.algorithm, key, iv) as crypto.DecipherGCM;

            // set additional auth data
            decipher.setAAD(Buffer.from('api-key'));
            decipher.setAuthTag(tag);

            // decrypt data
            let decrypted_data = decipher.update(encrypted_data);
            // final method completes decryption and verify tag, then return Buffer
            const final_part = decipher.final();
            // combat all decrypted data and convert to string
            return Buffer.concat([decrypted_data, final_part]).toString('utf8');
        } catch (error) {
            this.logger.error('Failed to decrypt API secret key', {
                error: (error as Error).message,
                hasEncryptedData: !!encryptedData
            });
            throw new Error('Failed to decrypt API secret key: invalid data or corrupted encryption');
        }
    }
    /**
     * validate the completeness of encrypted data
     * decrypt data and validate the completeness of data, do not return decrypted data
     * used for validating the integrity of encrypted data
     * @param encryptedData base64 encoded encrypted data and metadata
     * @returns true if data is complete and valid, false otherwise
     */
    async verifyEncryptedData(encryptedData: string): Promise<boolean> {
        try {
            await this.decryptApiKey(encryptedData);
            return true;
        } catch (error) {
            return false;
        }
    }
    /**
     * generate safe random secret key
     * generate random secret keys for specific usage
     * used for generating API secret keys, session secret keys and other secret keys
     * @param length length of the generated secret key
     * @returns base64 encoded random secret key
     */
    generateRandomSecureKey(length: number = 32): string {
        try {
            const key = crypto.randomBytes(length);
            return key.toString('base64');
        } catch (error) {
            this.logger.error('Failed to generate random secure key', (error as Error).message);
            throw new Error('Failed to generate secure key');
        }
    }
    /**
     * get encryption configuration
     * return current encryption configuration for reference and debugging
     * no sensitive secret key information is included in the returned configuration
     * @returns encryption configuration object
     */
    getEncryptionConfig(): Omit<EncryptionConfig, 'keyLength'> & {
        keyLength: string
    } {
        return {
            ...this.config,
            keyLength: `${this.config.keyLength * 8} bits` // convert key length to bits for better readability
        };
    }
}
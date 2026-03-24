import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, In, Not, IsNull } from "typeorm";
import { CexAccountManagementEntity } from "../entities/cex_account_management.entity";
import { AccountsEncryptionService } from "./accounts_encryption.service";
import { CreateCexAccountDto } from "../dtos/cex_accounts/create_cex_account.dto";
import { UpdateCexAccountDto } from "../dtos/cex_accounts/update_cex_account.dto";
import { CexAccountQueryDto } from "../dtos/cex_accounts/cex_account_query.dto";
import { CexAccountListResponseDto, CexAccountResponseDto } from "../dtos/cex_accounts/cex_account_response.dto";
import * as ccxt from "ccxt";
/**
 * CEX accounts management service
 * offer CEX accounts all services
 * including account creation, query, update, delete, and connection
 */
@Injectable()
export class CexAccountsService {
    private readonly logger = new Logger(CexAccountsService.name);

    constructor(
        @InjectRepository(CexAccountManagementEntity)
        private readonly cexAccountRepository: Repository<CexAccountManagementEntity>,
        private readonly accountsEncryptionService: AccountsEncryptionService,
        private readonly dataSource: DataSource
    ) {}
    /**
     * create a new CEX account
     * @param userId user ID from platform
     * @param createDto DTO for creating CEX account
     * @returns created CEX account information
     */
    async createCexAccount(userId: string, createDto: CreateCexAccountDto): Promise<CexAccountResponseDto> {
        this.logger.log(`Creating CEX account for user ${userId} on exchange ${createDto.exchange} with account type ${createDto.accountType}`);

        // normalize account type first, to keep 'future' and 'futures' compatible
        const normalizedAccountType = createDto.accountType === 'future' ? 'futures' : createDto.accountType;

        // check if the user already exists and is not soft deleted
        const existingAccount = await this.cexAccountRepository.findOne({
            where: {
                userId,
                exchange: createDto.exchange,
                accountType: normalizedAccountType,
                accountEnvironment: createDto.accountEnvironment,
                deletedAt: null,
            },
            withDeleted: false,
        });

        // allow recreate if previously soft deleted (restore path), otherwise conflict
        if (existingAccount) {
            throw new ConflictException('CEX account with the same exchange, account type and environment already exists for the user');
        }

        // check if a soft-deleted account exists: restore it instead of new insert
        const deletedAccount = await this.cexAccountRepository.findOne({
            where: {
                userId,
                exchange: createDto.exchange,
                accountType: normalizedAccountType,
                accountEnvironment: createDto.accountEnvironment,
                deletedAt: Not(IsNull()),
            },
            withDeleted: true,
        });
        if (deletedAccount) {
            deletedAccount.accountName = createDto.accountName;
            deletedAccount.apiKeyHash = await this.accountsEncryptionService.generateApiKeyHash(createDto.apiKey);
            deletedAccount.encryptedApiKey = await this.accountsEncryptionService.encryptApiSecret(createDto.apiKey);
            deletedAccount.encryptedApiSecret = await this.accountsEncryptionService.encryptApiSecret(createDto.apiSecret);
            deletedAccount.encryptedApiPassphrase = createDto.apiPassphrase ? await this.accountsEncryptionService.encryptApiSecret(createDto.apiPassphrase) : null;
            deletedAccount.permissions = createDto.permissions || ['read'];
            deletedAccount.canTrade = createDto.allowTrade;
            deletedAccount.canWithdraw = createDto.allowWithdraw;
            deletedAccount.canTransfer = createDto.allowTransfer;
            deletedAccount.configuration = createDto.additionalSettings;
            deletedAccount.exchangeConfig = createDto.exchangeConfiguration;
            deletedAccount.deletedAt = null;
            deletedAccount.status = 'active';
            deletedAccount.enabled = true;
            const restoredAccount = await this.cexAccountRepository.save(deletedAccount);
            return this.mapToResponseDto(restoredAccount);
        }

        const encryptedApiKey = await this.accountsEncryptionService.encryptApiSecret(createDto.apiKey);
        const encryptedApiSecret = await this.accountsEncryptionService.encryptApiSecret(createDto.apiSecret);
        const encryptedApiPassphrase = createDto.apiPassphrase ? await this.accountsEncryptionService.encryptApiSecret(createDto.apiPassphrase) : null;

        const apiKeyHash = await this.accountsEncryptionService.generateApiKeyHash(createDto.apiKey);

        // create account entity
        const account = this.cexAccountRepository.create({
            userId,
            exchange: createDto.exchange,
            exchangeDisplayName: this.getExchangeDisplayName(createDto.exchange),
            accountType: normalizedAccountType,
            accountEnvironment: createDto.accountEnvironment,
            accountName: createDto.accountName,
            apiKeyHash,
            encryptedApiKey,
            encryptedApiSecret,
            encryptedApiPassphrase,
            permissions: createDto.permissions,
            canTrade: createDto.allowTrade,
            canWithdraw: createDto.allowWithdraw,
            canTransfer: createDto.allowTransfer,
            configuration: createDto.additionalSettings,
            exchangeConfig: createDto.exchangeConfiguration
        });
        // save to database
        const savedAccount = await this.cexAccountRepository.save(account);
        this.logger.log(`CEX account created successfully with ID ${savedAccount.id} for user ${userId}`);
        return this.mapToResponseDto(savedAccount);
    }
    /**
     * query CEX accounts list
     * @param userId user ID from platform
     * @param queryDto query parameters
     * @returns list of CEX accounts and pagination information
     */
    async getCexAccounts(userId: string, queryDto: CexAccountQueryDto): Promise<CexAccountListResponseDto> {
        const queryBuilder = this.cexAccountRepository.createQueryBuilder('account')
        .where('account.userId = :userId', { userId })
        .andWhere('account.deletedAt IS NULL');
        // apply filters
        if (queryDto.exchange) {
            queryBuilder.andWhere('account.exchange = :exchange', { exchange: queryDto.exchange });
        }
        if (queryDto.accountType) {
            const normalizedQueryAccountType = queryDto.accountType === 'future' ? 'futures' : queryDto.accountType;
            queryBuilder.andWhere('account.accountType = :accountType', { accountType: normalizedQueryAccountType });
        }
        if (queryDto.accountEnvironment) {
            queryBuilder.andWhere('account.accountEnvironment = :accountEnvironment', { accountEnvironment: queryDto.accountEnvironment });
        }
        if (queryDto.accountStatus) {
            queryBuilder.andWhere('account.status = :accountStatus', { accountStatus: queryDto.accountStatus });
        }
        if (queryDto.enabled !== undefined) {
            queryBuilder.andWhere('account.enabled = :enabled', { enabled: queryDto.enabled });
        }
        if (queryDto.accountNameKeyWord || (queryDto as any).search) {
            const keyword = queryDto.accountNameKeyWord || (queryDto as any).search;
            queryBuilder.andWhere('account.accountName ILIKE :accountNameKeyword', { accountNameKeyword: `%${keyword}%` });
        }
        // sort
        const sortOrder = (queryDto as any).sortOrder === 'DESC' || queryDto.sortedDirection === 'DESC' ? 'DESC' : 'ASC';
        const sortBy = (queryDto as any).sortBy || queryDto.sortedBy || 'createdAt';
        queryBuilder.orderBy(`account.${sortBy}`, sortOrder);
        // pagination
        const offset = queryDto.getOffset();
        const limit = queryDto.getLimit();
        queryBuilder.skip(offset).take(limit);
        // execute query
        const [accounts, total] = await queryBuilder.getManyAndCount();
        return {
            items: accounts.map(account => this.mapToResponseDto(account)),
            total,
            page: queryDto.page || 1,
            pageSizeLimit: limit,
            totalPages: Math.ceil(total / limit)
        };
    }
    /**
     * get CEX account details by ID
     * @param userId user ID from platform
     * @param accountId CEX account ID
     * @returns CEX account details
     */
    async getAccountDetailsById(userId: string, accountId: number): Promise<CexAccountResponseDto> {
        const account = await this.cexAccountRepository.findOne({
            where: { id: accountId, userId, deletedAt: null },
        });
        if (!account) {
            throw new NotFoundException('CEX account not found');
        }
        return this.mapToResponseDto(account);
    }
    /**
     * update CEX account information
     * @param userId user ID from platform
     * @param accountId CEX account ID
     * @param updateDto DTO for updating CEX account
     * @returns updated CEX account information
     */
    async updateCexAccount(userId: string, accountId: number, updateDto: UpdateCexAccountDto): Promise<CexAccountResponseDto> {
        const account = await this.cexAccountRepository.findOne({
            where: { id: accountId, userId, deletedAt: null },
        });
        if (!account) {
            throw new NotFoundException('CEX account not found');
        }
        // update allowed fields
        if (updateDto.accountName !== undefined) {
            account.accountName = updateDto.accountName;
        }
        if (updateDto.permissions !== undefined) {
            account.permissions = updateDto.permissions;
        }
        if (updateDto.allowTrade !== undefined) {
            account.canTrade = updateDto.allowTrade;
        }
        if (updateDto.allowWithdraw !== undefined) {
            account.canWithdraw = updateDto.allowWithdraw;
        }
        if (updateDto.allowTransfer !== undefined) {
            account.canTransfer = updateDto.allowTransfer;
        }
        if (updateDto.status !== undefined) {
            account.status = updateDto.status;
        }
        if (updateDto.enabled !== undefined) {
            account.enabled = updateDto.enabled;
        }
        if (updateDto.configuration !== undefined) {
            account.configuration = updateDto.configuration
        }
        if (updateDto.exchangeConfiguration !== undefined) {
            account.exchangeConfig = updateDto.exchangeConfiguration;
        }
        const updatedAccount = await this.cexAccountRepository.save(account);
        this.logger.log(`CEX account with ID ${accountId} updated successfully for user ${userId}`);
        return this.mapToResponseDto(updatedAccount);
    }
    /**
     * delete CEX account (soft delete)
     * @param userId user ID from platform
     * @param accountId CEX account ID
     */
    async deleteAccountSoft(userId: string, accountId: number): Promise<void> {
        const account = await this.cexAccountRepository.findOne({
            where: { id: accountId, userId, deletedAt: null },
        });
        if (!account) {
            throw new NotFoundException('CEX account not found');
        }
        await this.cexAccountRepository.softDelete(accountId);
        this.logger.log(`CEX account with ID ${accountId} soft deleted successfully for user ${userId}`);
    }
    /**
     * test connection
     * @param userId user ID from platform
     * @param accountId CEX account ID
     * @returns connection test result
     */
    async testConnection(userId: string, accountId: number): Promise<{ success: boolean; message: string }> {
        const account = await this.cexAccountRepository.findOne({
            where: { id: accountId, userId, deletedAt: null },
        });
        if (!account) {
            throw new NotFoundException('CEX account not found');
        }
        try {
            const apiKey = await this.accountsEncryptionService.decryptApiKey(account.encryptedApiKey);
            const apiSecret = await this.accountsEncryptionService.decryptApiKey(account.encryptedApiSecret);
            const apiPassphrase = account.encryptedApiPassphrase
                ? await this.accountsEncryptionService.decryptApiKey(account.encryptedApiPassphrase)
                : undefined;

            // real API connection test using CCXT
            const exchangeKey = String(account.exchange || '').trim().toLowerCase();
            const normalizedExchangeKey = exchangeKey === 'future' ? 'futures' : exchangeKey;

            const ExchangeClass = (ccxt as any)[normalizedExchangeKey] || (ccxt as any)[exchangeKey];
            if (!ExchangeClass || typeof ExchangeClass !== 'function') {
                // some ccxt builds use PascalCase class key
                const pascalKey = normalizedExchangeKey.charAt(0).toUpperCase() + normalizedExchangeKey.slice(1);
                const ExchangeClassPascal = (ccxt as any)[pascalKey];
                if (ExchangeClassPascal && typeof ExchangeClassPascal === 'function') {
                    // tslint:disable-next-line: no-any
                    (ccxt as any)[normalizedExchangeKey] = ExchangeClassPascal;
                }
            }

            const FinalExchangeClass = (ccxt as any)[normalizedExchangeKey] || (ccxt as any)[exchangeKey];
            if (!FinalExchangeClass || typeof FinalExchangeClass !== 'function') {
                throw new Error(`Unsupported exchange: ${account.exchange}`);
            }

            const exchangeInstance = new (FinalExchangeClass as any)({
                apiKey,
                secret: apiSecret,
                ...(apiPassphrase && { password: apiPassphrase }),
                enableRateLimit: true,
                timeout: 15000,
                // use sandbox mode for test/demo environments
                ...(account.accountEnvironment !== 'live' && { sandbox: true }),
                // For futures markets on supported exchanges
                ...(account.accountType === 'futures' ? { defaultType: 'future' } : {}),
            });

            // validate API key by fetching account balance
            // this will throw an error if credentials are invalid
            await exchangeInstance.fetchBalance();

            // update account status on success
            account.connectionStatus = 'connected';
            account.healthStatus = 'healthy';
            account.lastUsedAt = new Date();
            account.consecutiveFailures = 0;

            await this.cexAccountRepository.save(account);
            this.logger.log(`✅CEX account ${accountId} connection test successful for user ${userId}`);
            return { success: true, message: 'Connection successful' };
        } catch (error) {
            const errorMessage = (error as Error).message || 'Unknown error occurred';
            this.logger.error(`❌CEX account ${accountId} connection test failed for user ${userId}: ${errorMessage}`);
            
            account.connectionStatus = 'error';
            account.healthStatus = 'error';
            account.consecutiveFailures += 1;
            account.lastErrorAt = new Date();
            account.lastErrorMessage = errorMessage;
            await this.cexAccountRepository.save(account);
            return { success: false, message: `Connection failed: ${errorMessage}` };
        }
    }
    /**
     * get exchange display name by exchange code
     * @param exchange exchange code
     * @returns exchange display name
     */
    private getExchangeDisplayName(exchange: string): string {
        const exchangeNames: Record<string, string> = {
            binance: 'Binance',
            okx: 'OKX',
            bybit: 'Bybit',
            gate: 'Gate.io',
            kucoin: 'KuCoin',
            bitget: 'Bitget',
        };
        return exchangeNames[exchange] || exchange;
    }
    /**
     * map account entity to response DTO
     * @param account CEX account entity
     * @returns CEX account response DTO
     */
    private mapToResponseDto(account: CexAccountManagementEntity): CexAccountResponseDto {
        return {
            id: account.id,
            userId: account.userId,
            exchange: account.exchange,
            exchangeDisplayName: account.exchangeDisplayName,
            accountType: account.accountType,
            accountEnvironment: account.accountEnvironment,
            accountName: account.accountName,
            otherAccountName: account.accountOtherName || '',
            permissions: account.permissions as any || [],
            allowTrade: !!account.canTrade,
            allowWithdraw: !!account.canWithdraw,
            allowTransfer: !!account.canTransfer,
            status: account.status,
            enabled: account.enabled,
            healthStatus: account.healthStatus,
            lastUsedAt: account.lastUsedAt ? account.lastUsedAt.toISOString() : null,
            apiUseAmount: Number(account.usageCount || 0),
            dailyApiUseCount: Number(account.dailyUsageCount || 0),
            consecutiveFailureCount: account.consecutiveFailures,
            lastErrorAt: account.lastErrorAt ? account.lastErrorAt.toISOString() : null,
            lastErrorMessage: account.lastErrorMessage || null,
            configuration: account.configuration || undefined,
            additionalExchangeSettings: account.exchangeConfig || undefined,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
        };
    }
}
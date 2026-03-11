import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, In } from "typeorm";
import { CexAccountManagementEntity } from "../entities/cex_account_management.entity";
import { AccountsEncryptionService } from "./accounts_encryption.service";
import { CreateCexAccountDto } from "../dtos/cex_accounts/create_cex_account.dto";
import { UpdateCexAccountDto } from "../dtos/cex_accounts/update_cex_account.dto";
import { CexAccountQueryDto } from "../dtos/cex_accounts/cex_account_query.dto";
import { CexAccountListResponseDto, CexAccountResponseDto } from "../dtos/cex_accounts/cex_account_response.dto";
import { query } from "winston";
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

        // check if the user already exists
        const existingAccount = await this.cexAccountRepository.findOne({
            where: {
                userId,
                exchange: createDto.exchange,
                accountType: createDto.accountType,
                accountEnvironment: createDto.accountEnvironment,
            },
        });
        if (existingAccount) {
            throw new ConflictException('CEX account with the same exchange, account type and environment already exists for the user');
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
            accountType: createDto.accountType,
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
            queryBuilder.andWhere('account.accountType = :accountType', { accountType: queryDto.accountType });
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
            // ❌ real API connection test,,实际的API测试连接
            account.connectionStatus = 'connected';
            account.healthStatus = 'healthy';
            account.lastUsedAt = new Date();
            account.consecutiveFailures = 0;

            await this.cexAccountRepository.save(account);
            return { success: true, message: 'Connection successful' };
        } catch (error) {
            account.connectionStatus = 'error';
            account.healthStatus = 'error';
            account.consecutiveFailures += 1;
            account.lastErrorAt = new Date();
            account.lastErrorMessage = error.message;
            await this.cexAccountRepository.save(account);
            return { success: false, message: `Connection failed: ${error.message}` };
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
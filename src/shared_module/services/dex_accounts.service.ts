import { Injectable, Logger, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import * as crypto from "crypto";
import { JsonRpcProvider } from "ethers";

import { DexAccountManagementEntity } from "../entities/dex_account_management.entity";
import { CreateDexAccountDto } from "../dtos/dex_accounts/create_dex_account.dto";
import { UpdateDexAccountDto } from "../dtos/dex_accounts/update_dex_account.dto";
import { DexAccountQueryDto } from "../dtos/dex_accounts/dex_account_query.dto";
import { DexAccountListResponseDto, DexAccountResponseDto } from "../dtos/dex_accounts/dex_account_response.dto";
/**
 * DEX accounts management service
 */
@Injectable()
export class DexAccountsService {
    private readonly logger = new Logger(DexAccountsService.name);

    // RPC endpoints for blockchain network verification
    private readonly RPC_ENDPOINTS: Record<number, string> = {
        1: 'https://eth.llamarpc.com',
        56: 'https://bsc-dataseed.binance.org',
        137: 'https://polygon-rpc.com',
        42161: 'https://arb1.arbitrum.io/rpc',
        10: 'https://mainnet.optimism.io',
    };

    constructor(
        @InjectRepository(DexAccountManagementEntity)
        private readonly dexAccountRepository: Repository<DexAccountManagementEntity>,
        private readonly dataSource: DataSource
    ) {}
    /**
     * create a new DEX account
     * @param userId user ID
     * @param createDto create DEX account DTO
     */
    async createDexAccount(userId: string, createDto: CreateDexAccountDto): Promise<DexAccountResponseDto> {
        this.logger.log(`Creating DEX account for user ${userId}, chainId=${createDto.blockchainWebsiteId}, wallet=${createDto.walletAddress}`);
        const exists = await this.dexAccountRepository.findOne({
            where: {
                userId,
                chainId: createDto.blockchainWebsiteId,
                walletAddress: createDto.walletAddress
            },
        });
        if (exists) {
            throw new ConflictException('DEX account with the same wallet address already exists for this user and blockchain website');
        }
        const walletAddressHash = this.generateWalletHash(createDto.walletAddress);
        // 强制单个实体，避免TS选择数组重载
        const entity = this.dexAccountRepository.create({
            userId,
            chainId: createDto.blockchainWebsiteId,
            chainName: this.getChainName(createDto.blockchainWebsiteId),
            chainDisplayName: this.getChainDisplayName(createDto.blockchainWebsiteId),
            walletAddress: createDto.walletAddress,
            walletAddressHash,
            publicKey: null,
            walletType: createDto.walletType,
            walletProvider: createDto.walletProvider,
            walletClientVersion: createDto.walletClientVersion || null,
            dexPlatform: createDto.dexPlatform || null,
            dexPlatformVersion: createDto.dexPlatformVersion || null,
            permissions: createDto.permissions,
            canTrade: createDto.allowTrade,
            canLiquidate: createDto.allowLiquidity,
            canStake: createDto.allowStake,
            status: 'active',
            enabled: true,
            connectionStatus: 'disconnected',
            healthStatus: 'unknown',
            gasReferenceType: createDto.gasFeeReference,
            gasSettings: createDto.gasSettings || null,
            accountConfiguration: createDto.accountConfiguration || null,
            additionalDexConfiguration: createDto.specificDexConfiguration || null,
            walletConfiguration: createDto.walletConfiguration || null,
            tags: createDto.tags || [],
        } as Partial<DexAccountManagementEntity>);
        const saved = await this.dexAccountRepository.save(entity);
        this.logger.log(`DEX account created with ID ${saved.id} for user ${userId}`);
        return this.mapToResponseDto(saved);
    }
    /**
     * query DEX accounts with filters and pagination
     */
    async getDexAccounts(userId: string, queryDto: DexAccountQueryDto): Promise<DexAccountListResponseDto> {
        const qb = this.dexAccountRepository.createQueryBuilder('account')
        .where('account.userId = :userId', { userId })
        .andWhere('account.deletedAt IS NULL');
        if (queryDto.blockchainWebsiteId) {
            qb.andWhere('account.chainId = :chainId', { chainId: queryDto.blockchainWebsiteId });
        }
        if (queryDto.walletType) {
            qb.andWhere('account.walletType = :walletType', { walletType: queryDto.walletType });
        }
        if (queryDto.dexPlatform) {
            qb.andWhere('account.dexPlatform = :dexPlatform', { dexPlatform: queryDto.dexPlatform });
        }
        if (queryDto.accountStatus) {
            qb.andWhere('account.status = :status', { status: queryDto.accountStatus });
        }
        if (queryDto.enabled !== undefined) {
            qb.andWhere('account.enabled = :enabled', { enabled: queryDto.enabled });
        }
        if (queryDto.connectionStatus) {
            qb.andWhere('account.connectionStatus = :connectionStatus', { connectionStatus: queryDto.connectionStatus });
        }
        if (queryDto.healthStatus) {
            qb.andWhere('account.healthStatus = :healthStatus', { healthStatus: queryDto.healthStatus });
        }
        if (queryDto.walletAddressKeyword) {
            qb.andWhere('account.walletAddress ILIKE :walletAddressKeyword', { walletAddressKeyword: `%${queryDto.walletAddressKeyword}%` });
        }
        if (queryDto.tag) {
            qb.andWhere(`account.tags::jsonb ? :tag`, { tag: queryDto.tag });
        }
        if (queryDto.createdAfter) {
            qb.andWhere('account.createdAt >= :createdAfter', { createdAfter: queryDto.createdAfter });
        }
        if (queryDto.createdBefore) {
            qb.andWhere('account.createdAt <= :createdBefore', { createdBefore: queryDto.createdBefore });
        }
        if (queryDto.lastUsedAfter) {
            qb.andWhere('account.lastUsedAt >= :lastUsedAfter', { lastUsedAfter: queryDto.lastUsedAfter });
        }
        if (queryDto.lastUsedBefore) {
            qb.andWhere('account.lastUsedAt <= :lastUsedBefore', { lastUsedBefore: queryDto.lastUsedBefore });
        }
        const sortOrder = queryDto.sortedDirection === 'DESC' ? 'DESC' : 'ASC';
        const sortBy = queryDto.sortedBy || 'createdAt';
        qb.orderBy(`account.${sortBy}`, sortOrder);
        const offset = queryDto.getOffset();
        const limit = queryDto.getLimit();
        qb.skip(offset).take(limit);
        const [accounts, total] = await qb.getManyAndCount();
        return {
            items: accounts.map(account => this.mapToResponseDto(account)),
            total,
            page: queryDto.page || 1,
            pageSizeLimit: limit,
            totalPages: Math.ceil(total / limit),
        };
        }
        /**
         * query details of a DEX account by ID
         */
        async getDexAccountById(userId: string, accountId: number): Promise<DexAccountResponseDto> {
            const account = await this.dexAccountRepository.findOne({
                where: { id: accountId, userId, deletedAt: null }
            });
            if (!account) {
                throw new NotFoundException('DEX account not found');
            }
            return this.mapToResponseDto(account);
    }
    /**
     * uodate DEX account information
     */
    async updateDexAccount(userId: string, accountId: number, dto: UpdateDexAccountDto): Promise<DexAccountResponseDto> {
        const account = await this.dexAccountRepository.findOne({
            where: { id: accountId, userId, deletedAt: null }
        });
        if (!account) {
            throw new NotFoundException('DEX account not found');
        }
        if (dto.walletType !== undefined) account.walletType = dto.walletType;
        if (dto.walletProvider !== undefined) account.walletProvider = dto.walletProvider;
        if (dto.walletClientVersion !== undefined) account.walletClientVersion = dto.walletClientVersion;
        if (dto.dexPlatform !== undefined) account.dexPlatform = dto.dexPlatform;
        if (dto.dexPlatformVersion !== undefined) account.dexPlatformVersion = dto.dexPlatformVersion;
        if (dto.permissions !== undefined) account.permissions = dto.permissions;
        if (dto.allowTrade !== undefined) account.canTrade = dto.allowTrade;
        if (dto.allowLiquidity !== undefined) account.canLiquidate = dto.allowLiquidity;
        if (dto.allowStake !== undefined) account.canStake = dto.allowStake;
        if (dto.status !== undefined) account.status = dto.status;
        if (dto.enabled !== undefined) account.enabled = dto.enabled;
        if (dto.gasFeeReferenceType !== undefined) account.gasReferenceType = dto.gasFeeReferenceType;
        if (dto.gasSettings !== undefined) account.gasSettings = dto.gasSettings;
        if (dto.accountConfiguration !== undefined) account.configuration = dto.accountConfiguration;
        if (dto.additionalDexConfiguration !== undefined) account.dexConfiguration = dto.additionalDexConfiguration;
        if (dto.walletConfiguration !== undefined) account.walletConfiguration = dto.walletConfiguration;
        if (dto.tags !== undefined) account.tags = dto.tags;

        const updated = await this.dexAccountRepository.save(account);
        this.logger.log(`DEX account with ID ${accountId} updated for user ${userId}`);
        return this.mapToResponseDto(updated);
    }
    /**
     * delete a DEX account (soft delete)
     */
    async deleteAccountSoft(userId: string, accountId: number): Promise<void> {
        const account = await this.dexAccountRepository.findOne({
            where: { id: accountId, userId, deletedAt: null }
        })
        if (!account) {
            throw new NotFoundException('DEX account not found');
        }
        await this.dexAccountRepository.softDelete(accountId);
        this.logger.log(`DEX account with ID ${accountId} soft deleted for user ${userId}`);
    }
    /**
     * connection test
     */
    async connectionTest(userId: string, accountId: number): Promise<{ success: boolean; message: string }> {
        const account = await this.dexAccountRepository.findOne({
            where : { id: accountId, userId, deletedAt: null }
        });
        if (!account) {
            throw new NotFoundException('DEX account not found');
        }
        try {
            // real blockchain wallet connection test using RPC
            const rpcUrl = this.RPC_ENDPOINTS[account.chainId];
            
            if (!rpcUrl) {
                // for chains without RPC support (e.g. Hyperliquid, Solana), skip on-chain verification
                this.logger.warn(`No RPC endpoint configured for chainId ${account.chainId}, skipping on-chain verification`);
                account.connectionStatus = 'connected';
                account.healthStatus = 'healthy';
                account.lastUsedAt = new Date();
                await this.dexAccountRepository.save(account);
                return { success: true, message: 'Wallet address accepted (no RPC verification available for this chain)' };
            }

            // verify wallet address on-chain by fetching balance
            const provider = new JsonRpcProvider(rpcUrl, undefined, {
                staticNetwork: true,
            });
            
            const balance = await provider.getBalance(account.walletAddress);
            const balanceEth = Number(balance) / 1e18;

            // update account status on success
            account.connectionStatus = 'connected';
            account.healthStatus = 'healthy';
            account.lastUsedAt = new Date();
            await this.dexAccountRepository.save(account);
            
            this.logger.log(`✅DEX account ${accountId} connection test successful for user ${userId}, balance: ${balanceEth} ETH`);
            return { success: true, message: `✅Connection test successful, wallet balance: ${balanceEth.toFixed(6)} native token` };
        } catch (error) {
            const errorMessage = (error as Error).message || 'Unknown error occurred';
            this.logger.error(`❌DEX account ${accountId} connection test failed for user ${userId}: ${errorMessage}`);
            
            account.connectionStatus = 'error';
            account.healthStatus = 'error';
            await this.dexAccountRepository.save(account);
            return { success: false, message: `Connection test failed: ${errorMessage}` };
        }
    }
    /**
     * turn entity to response DTO
     */
    private mapToResponseDto(account: DexAccountManagementEntity): DexAccountResponseDto {
        return {
            id: account.id,
            userId: account.userId,
            blockchainWebsiteId: account.chainId,
            blockchainWebsiteName: account.chainName,
            blockchainWebsiteDisplayName: account.chainDisplayName,
            websiteType: account.networkType,
            walletAddress: account.walletAddress,
            walletType: account.walletType,
            walletProvider: account.walletProvider,
            walletClientVersion: account.walletClientVersion,
            dexPlatform: account.dexPlatform,
            dexPlatformVersion: account.dexPlatformVersion,
            permissions: account.permissions as any || [],
            allowTrade: !!account.canTrade,
            allowLiquidity: !!account.canLiquidate,
            allowStake: !!account.canStake,
            status: account.status,
            enabled: account.enabled,
            connectionStatus: account.connectionStatus,
            healthStatus: account.healthStatus,
            lastUsedAt: account.lastUsedAt ? account.lastUsedAt.toISOString() : null,
            totalTradeCounts: Number(account.tradeCount || 0),
            totalSuccessfulTradeCounts: Number(account.successfulTradeCount || 0),
            totalFailedTradeCounts: Number(account.failedTradeCount || 0),
            consecutiveFailedTradeCounts: Number(account.consecutiveFailedTradeCount || 0),
            gasFeeReferenceType: account.gasReferenceType,
            gasSettings: account.gasSettings || undefined,
            accountConfiguration: account.configuration || undefined,
            additionalDexConfiguration: account.dexConfiguration || undefined,
            walletConfiguration: account.walletConfiguration || undefined,
            tags: account.tags || undefined,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
        };
    }
    /**
     * generate hash for wallet address to enhance security
     */
    private generateWalletHash(walletAddress: string): string {
        return crypto.createHash('sha256').update(walletAddress).digest('hex');
    }
    /**
     * chain name mapping
     */
    private getChainName(id: number): string {
        const map: Record<number, string> = {
            1: 'ethereum',
            56: 'binance-smart-chain',
            137: 'polygon',
            42161: 'arbitrum-one',
            10: 'optimism',
            998: 'hyperliquid-l1',
            1399811149: 'solana-mainnet',

        };
        return map[id] || `chain_${id}`;
    }
    private getChainDisplayName(id: number): string {
        const map: Record<number, string> = {
            1: 'Ethereum',
            56: 'Binance Smart Chain',
            137: 'Polygon',
            42161: 'Arbitrum One',
            10: 'Optimism',
            998: 'Hyperliquid L1',
            1399811149: 'Solana Mainnet',
        };
        return map[id] || `Chain ${id}`;
    };
}
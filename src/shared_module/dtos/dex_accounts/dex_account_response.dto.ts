import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Transform } from "class-transformer";
/**
 * DEX account response DTO
 * used for formating and returning the DEX account information to the client
 * do not include sensitive information, such as secret key
 */
export class DexAccountResponseDto {
    @ApiProperty({
        description: 'DEX account unique ID',
        example: '1'
    })
    @Expose()
    id: number;
    
    @ApiProperty({
        description: 'user id',
        example: 'user_1',
    })
    @Expose()
    userId: string;
    
    @ApiProperty({
        description: 'blockchain website ID',
        example: 1,
    })
    @Expose()
    blockchainWebsiteId: number;
    
    @ApiProperty({
        description: 'blockchain website name',
        example: 'Ethereum',
    })
    @Expose()
    blockchainWebsiteName: string;
    
    @ApiProperty({
        description: 'blockchain weisite display name',
        example: 'Ethereum',
    })
    @Expose()
    blockchainWebsiteDisplayName: string;
    
    @ApiProperty({
        description: 'website type',
        example: 'mainnet',
        enum: ['mainnet', 'testnet']
    })
    @Expose()
    websiteType: string;
    
    @ApiProperty({
        description: 'wallet address',
        example: '0x23...'
    })
    @Expose()
    walletAddress: string;
    
    @ApiProperty({
        description: 'wallet type',
        example: 'metamask',
        enum: ['metamask', 'okx', 'trustwallet', 'coinbasewallet', 'phantomwallet', 'other']
    })
    @Expose()
    walletType: string;
    
    @ApiProperty({
        description: 'wallet provider',
        example: 'MetaMask',
    })
    @Expose()
    walletProvider: string;
    
    @ApiPropertyOptional({
        description: 'wallet client version',
        example: 'MetaMask 10.0.0',
        required: false,
    })
    @Expose()
    walletClientVersion: string;
    
    @ApiPropertyOptional({
        description: 'DEX platform',
        example: 'uniswap',
        enum: ['hyperliquid', 'uniswap', 'sushiswap', 'pancakeswap', '1inch', 'other'],
    })
    @Expose()
    dexPlatform?: string;

    @ApiPropertyOptional({
        description: 'DEX platform version',
        example: 'v3',
    })
    @Expose()
    dexPlatformVersion?: string;

    @ApiProperty({
        description: 'account permissions configuration',
        example: ['read', 'trade', 'swap']
    })
    @Expose()
    @Transform(({ value }) => {
        if (Array.isArray(value)) {
            return value;
        }
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return []
            }
        }
        return value || [];
    })
    permissions: string[];

    @ApiProperty({
        description: 'whether allow trade',
        example: true
    })
    @Expose()
    allowTrade: boolean;
    
    @ApiProperty({
        description: 'whether allow liquidity',
        example: false
    })
    @Expose()
    allowLiquidity: boolean;
    
    @ApiProperty({
        description: 'whether allow stake',
        example: false
    })
    @Expose()
    allowStake: boolean;
    
    @ApiProperty({
        description: 'account status, e.g. active, inactive, suspended, expired',
        example: 'active',
        enum: ['active', 'inactive', 'suspended', 'expired']
    })
    @Expose()
    status: string;
    
    @ApiProperty({
        description: 'if the account is enabled',
        example: true
    })
    @Expose()
    enabled: boolean;
    
    @ApiProperty({
        description: 'connection status',
        example: 'connected',
        enum: ['connected', 'disconnected', 'connecting', 'error']
    })
    @Expose()
    connectionStatus: string;
    
    @ApiProperty({
        description: 'account health status',
        example: 'healthy',
        enum: ['healthy', 'warning', 'error', 'unknown']
    })
    @Expose()
    healthStatus: string;

    @ApiPropertyOptional({
        description: 'last used time',
        example: '2024-01-01T00:00:00Z',
    })
    @Expose()
    lastUsedAt: string;

    @ApiProperty({
        description: 'total trade counts',
        example: 1500
    })
    @Expose()
    totalTradeCounts: number;

    @ApiProperty({
        description: 'total successful trade counts',
        example: 1400
    })
    @Expose()
    totalSuccessfulTradeCounts: number;

    @ApiProperty({
        description: 'total failed trade counts',
        example: 100
    })
    @Expose()
    totalFailedTradeCounts: number;
    
    @ApiProperty({
        description: 'consecutive failed trade counts',
        example: 0
    })
    @Expose()
    consecutiveFailedTradeCounts: number;

    @ApiProperty({
        description: 'gas fee reference for DEX transactions.',
        example: 'standard',
        enum: ['slow', 'standard', 'fast', 'instant']
    })
    @Expose()
    gasFeeReferenceType: string;

    @ApiPropertyOptional({
        description: 'gas settings',
        example: { 'gasLimit': 200000, 'maxFeePerGas': '50000000000' },
    })
    @Expose()
    gasSettings: Record<string, any>;

    @ApiPropertyOptional({
        description: 'account configuration',
        example: { 'slippage': 0.5, 'deadline': 300 },
    })
    @Expose()
    accountConfiguration?: Record<string, any>;

    @ApiPropertyOptional({
        description: 'specific configuration for the DEX account, in JSON format.',
        example: { 'routers': ['0x323...'], 'protocols': ['v2', 'v3'] }
    })
    @Expose()
    additionalDexConfiguration?: Record<string, any>;

    @ApiPropertyOptional({
        description: 'wallet configuration for DEX accounts, in JSON format.',
        example: { 'rpcUrl': 'https://mainnet.infura.io/v3/your-project-id', 'blockchainWebsiteId': 1 }
    })
    @Expose()
    walletConfiguration?: Record<string, any>;

    @ApiPropertyOptional({
        description: 'account label',
        example: ['defi']
    })
    @Expose()
    tags?: string[];

    @ApiProperty({
        description: 'creation time',
        example: '2024-01-01T00:00:00Z'
    })
    @Expose()
    createdAt: Date;
    
    @ApiProperty({
        description: 'last updated time',
        example: '2024-01-01T00:00:00Z'
    })
    @Expose()
    updatedAt: Date;
}

/**
 * DEX account list response DTO
 * used for returning the list of DEX accounts with pagination information
 */
export class DexAccountListResponseDto {
    @ApiProperty({
        description: 'account list',
        type: [DexAccountResponseDto]
    })
    @Expose()
    items: DexAccountResponseDto[];
    
    @ApiProperty({
        description: 'total number of accounts',
        example: 25
    })
    @Expose()
    total: number;
    
    @ApiProperty({
        description: 'current page number',
        example: 1
    })
    @Expose()
    page: number;

    @ApiProperty({
        description: 'number of accounts per page',
        example: 10
    })
    @Expose()
    pageSizeLimit: number;

    @ApiProperty({
        description: 'total number of pages',
        example: 3
    })
    @Expose()
    totalPages: number;
}

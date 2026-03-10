import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Transform } from "class-transformer";
/**
 * CEX account response DTO
 * used for formating and returning the CEX account information to the client
 * do not include sensitive information
 */
export class CexAccountResponseDto {
    @ApiProperty({
        description: 'CEX account unique ID',
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
        description: 'exchange name, e.g. binance, okx, etc.',
        example: 'binance',
    })
    @Expose()
    exchange: string;
    
    @ApiProperty({
        description: 'exchange display name, e.g. Binance, OKX, etc.',
        example: 'Binance',
    })
    @Expose()
    exchangeDisplayName: string;
    
    @ApiProperty({
        description: 'account type, e.g. spot, futures, etc.',
        example: 'spot',
        enum: ['spot', 'futures']
    })
    @Expose()
    accountType: string;
    
    @ApiProperty({
        description: 'account environment, e.g. live, test, demo, etc.',
        example: 'live',
        enum: ['live', 'test', 'demo']
    })
    @Expose()
    accountEnvironment: string;
    
    @ApiProperty({
        description: 'custom account name for the CEX account, e.g. main trade account, etc.',
        example: 'main trade account',
    })
    @Expose()
    accountName: string;

    @ApiProperty({
        description: 'other account name',
        example: 'binance_main'
    })
    @Expose()
    otherAccountName: string;

    @ApiProperty({
        description: 'account permissions settings, e.g. read, trade, withdraw, etc.',
        example: ['read', 'trade', 'withdraw', 'transfer'],
    })
    @Expose()
    @Transform(({ value}) => {
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return [];
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
        description: 'whether allow withdraw',
        example: false
    })
    @Expose()
    allowWithdraw: boolean;
    
    @ApiProperty({
        description: 'whether allow transfer',
        example: false
    })
    @Expose()
    allowTransfer: boolean;
    
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
        description: 'account health status',
        example: 'healthy',
        enum: ['healthy', 'warning', 'error', 'unknown']
    })
    @Expose()
    healthStatus: string;

    @ApiPropertyOptional({
        description: 'last time when account was used',
        example: '2024-01-01T00:00:00Z'
    })
    @Expose()
    lastUsedAt: string;

    @ApiProperty({
        description: 'API use amount',
        example: 1500
    })
    @Expose()
    apiUseAmount: number;

    @ApiProperty({
        description: 'API use count in the last 24 hours',
        example: 100
    })
    @Expose()
    dailyApiUseCount: number;
    
    @ApiProperty({
        description: 'consecutive counts of failure',
        example: 0
    })
    @Expose()
    consecutiveFailureCount: number;

    @ApiPropertyOptional({
        description: 'last error happened time',
        example: '2024-01-01T00:00:00Z'
    })
    @Expose()
    lastErrorAt: string;

    @ApiPropertyOptional({
        description: 'last error message',
        example: 'API rate limit exceeded'
    })
    @Expose()
    lastErrorMessage: string;

    @ApiPropertyOptional({
        description: 'account configuration',
        example: { 'rateLimit': 1000, 'timeout': 5000 }
    })
    @Expose()
    configuration?: Record<string, any>;

    @ApiPropertyOptional({
        description: 'additional settings for the CEX account',
        example: { 'apiVersion': 'v3'}
    })
    @Expose()
    additionalExchangeSettings?: Record<string, any>;

    @ApiProperty({
        description: 'account created time',
        example: '2024-01-01T00:00:00Z'
    })
    @Expose()
    createdAt: Date;
    
    @ApiProperty({
        description: 'account updated time',
        example: '2024-01-01T00:00:00Z'
    })
    @Expose()
    updatedAt: Date;
}
/**
 * CEX account list response DTO
 * used for returning the list of CEX accounts with pagination information
 */
export class CexAccountListResponseDto {
    @ApiProperty({
        description: 'account list',
        type: [CexAccountListResponseDto]
    })
    @Expose()
    items: CexAccountResponseDto[];

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

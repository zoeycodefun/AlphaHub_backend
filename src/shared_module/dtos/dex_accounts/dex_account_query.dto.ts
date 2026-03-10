import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsEnum, IsBoolean, IsInt, Min, Max, IsDateString } from "class-validator";
import { Type, Transform } from "class-transformer";
import { PaginationDto } from "../common/pagination.dto";
/**
 * DEX account query DTO
 * used for the verification and transformation of the input data when querying DEX accounts
 * support pagination, filtering and sorting
 */
export class DexAccountQueryDto extends PaginationDto {
    @ApiPropertyOptional({
        description: 'filtered by user ID',
        example: 'user_1'
    })
    @IsOptional()
    @IsString({ message: 'user ID must be a string' })
    userId?: string;
    
    @ApiPropertyOptional({
        description: 'filtered by blockchain network ID',
        example: 1,
    })
    @IsOptional()
    @IsInt({ message: 'network ID must be an integer' })
    @Min(1, { message: 'network ID must be greater than or equal to 1' })
    blockchainWebsiteId?: number;

    @ApiPropertyOptional({
        description: 'filtered by wallet type',
        example: 'metamask',
        enum: ['metamask', 'okx', 'trustwallet', 'coinbasewallet', 'phantomwallet', 'other']
    })
    @IsOptional()
    @IsEnum(['metamask', 'okx', 'trustwallet', 'coinbasewallet', 'phantomwallet', 'other'], { message: 'wallet type must be one of the following: metamask, okx, trustwallet, coinbasewallet, phantomwallet, other' })
    walletType?: string;
    
    @ApiPropertyOptional({
        description: 'filtered by DEX platform',
        example: 'uniswap',
        enum: ['hyperliquid', 'uniswap', 'sushiswap', 'pancakeswap', '1inch', 'other']
    })
    @IsOptional()
    @IsEnum(['hyperliquid', 'uniswap', 'sushiswap', 'pancakeswap', '1inch', 'other'], { message: 'DEX platform must be one of the following: hyperliquid, uniswap, sushiswap, pancakeswap, 1inch, other' })
    dexPlatform?: string;
    
    @ApiPropertyOptional({
        description: 'filtered by account status',
        example: 'active',
        enum: ['active', 'inactive', 'suspended', 'expired']
    })
    @IsOptional()
    @IsEnum(['active', 'inactive', 'suspended', 'expired'], { message: 'account status must be either active, inactive, suspended or expired' })
    accountStatus?: string;
    
    @ApiPropertyOptional({
        description: 'filtered by status of whether enabled',
        example: true
    })
    @IsOptional()
    @IsBoolean({ message: 'enabled must be a boolean'})
    @Type(() => Boolean)
    enabled?: boolean;

    @ApiPropertyOptional({
        description: 'filtered by connection status',
        example: 'connected',
        enum: ['connected', 'disconnected', 'connecting', 'error']
    })
    @IsOptional()
    @IsEnum(['connected', 'disconnected', 'connecting', 'error'], { message: 'connection status must be one of the following: connected, disconnected, connecting, error' })
    connectionStatus?: string;

    @ApiPropertyOptional({
        description: 'filtered by health status',
        example: 'healthy',
        enum: ['healthy', 'warning', 'error', 'unknown']
    })
    @IsOptional()
    @IsEnum(['healthy', 'warning', 'error', 'unknown'], { message: 'health status must be one of the following: healthy, warning, error, unknown' })
    healthStatus?: string;
    
    @ApiPropertyOptional({
        description: 'filtered by wallet address keyword',
        example: '0x23...'
    })
    @IsOptional()
    @IsString({ message: 'wallet address keyword must be a string' })
    walletAddressKeyword?: string;
    
    @ApiPropertyOptional({
        description: 'filtered by tag',
        example: 'defi'
    })
    @IsOptional()
    @IsString({ message: 'label must be a string' })
    tag?: string;

    @ApiPropertyOptional({
        description: 'filtered by the creation date, query the accounts created after the specific date',
        example: '2024-01-01T00:00:00Z'
    })
    @IsOptional()
    @IsDateString({}, { message: 'createdAfter must be a valid ISO 8601 date string' })
    createdAfter?: string;

    @ApiPropertyOptional({
        description: 'filtered by the creation date, query the accounts created before the specific date',
        example: '2024-12-31T23:59:59Z'
    })
    @IsOptional()
    @IsDateString({}, { message: 'createdBefore must be a valid ISO 8601 date string' })
    createdBefore?: string;
    
    @ApiPropertyOptional({
        description: 'filtered by the last used date, query the accounts last used after the specific date',
        example: '2024-01-01T00:00:00Z'
    })
    @IsOptional()
    @IsDateString({}, { message: 'lastUsedAfter must be a valid ISO 8601 date string' })
    lastUsedAfter?: string;
    
    @ApiPropertyOptional({
        description: 'filtered by the last used date, query the accounts last used before the specific date',
        example: '2024-12-31T23:59:59Z'
    })
    @IsOptional()
    @IsDateString({}, { message: 'lastUsedBefore must be a valid ISO 8601 date string' })
    lastUsedBefore?: string;
    
    @ApiPropertyOptional({
        description: 'sort characteristics',
        example: 'createdAt',
        enum: ['createdAt', 'lastUsedAt', 'updatedAt', 'totalTradeCounts', 'walletAddress']
    })
    @IsOptional()
    @IsEnum(['createdAt', 'lastUsedAt', 'updatedAt', 'totalTradeCounts', 'walletAddress'], { message: 'orderBy must be one of createdAt, lastUsedAt, updatedAt, totalTradeCounts, walletAddress' })
    sortedBy?: string = 'createdAt';

    @ApiPropertyOptional({
        description: 'sort direction',
        example: 'desc',
        enum: ['asc', 'desc']
    })
    @IsOptional()
    @IsEnum(['asc', 'desc'], { message: 'orderDirection must be either asc or desc' })
    sortedDirection?: 'ASC' | 'DESC' = 'DESC';

}
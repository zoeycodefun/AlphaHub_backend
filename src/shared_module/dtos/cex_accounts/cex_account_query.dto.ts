import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsEnum, IsBoolean, IsInt, Min, Max, IsDateString  } from "class-validator";
import { Type, Transform } from "class-transformer";
import { PaginationDto } from "../common/pagination.dto";
/**
 * CEX account query DTO
 * used for the verification and transformation of the input data when querying CEX accounts
 * support pagination, filtering and sorting
 */
export class CexAccountQueryDto extends PaginationDto {
    @ApiPropertyOptional({
        description: 'filtered by user ID',
        example: 'user_1'
    })
    @IsOptional()
    @IsString({ message: 'user ID must be a string' })
    userId?: string;

    @ApiPropertyOptional({
        description: 'filtered by exchanges name',
        example: 'binance',
        enum: ['binance', 'okx', 'bybit', 'gate', 'kucoin', 'bitget']
    })
    @IsOptional()
    @IsString({ message: 'exchange must be a string' })
    exchange?: string;

    @ApiPropertyOptional({
        description: 'filtered by account type',
        example: 'spot',
        enum: ['spot', 'future']
    })
    @IsOptional()
    @IsEnum(['spot', 'future'], { message: 'account type must be either spot or future' })
    accountType?: string;
    
    @ApiPropertyOptional({
        description: 'filtered by account environment',
        example: 'live',
        enum: ['live', 'test', 'demo']
    })
    @IsOptional()
    @IsEnum(['live', 'test', 'demo'], { message: 'account environment must be either live, test or demo' })
    accountEnvironment?: string;
    
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
    @IsBoolean({ message: 'enabled must be a boolean' })
    @Type(() => Boolean)
    enabled?: boolean;

    @ApiPropertyOptional({
        description: 'filtered by health status',
        example: 'healthy',
        enum: ['healthy', 'warning', 'error', 'unkonwn']
    })
    @IsOptional()
    @IsEnum(['healthy', 'warning', 'error', 'unkonwn'], { message: 'health status must be either healthy, warning, error or unknown' })
    healthStatus?: string;

    @ApiPropertyOptional({
        description: 'filtered by the key words of the account name',
        example: 'main trade account'
    })
    @IsOptional()
    @IsString({ message: 'account name must be a string' })
    accountNameKeyWord?: string;
    
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
        enum: ['createdAt', 'lastUsedAt', 'updatedAt', 'dailyApiUseCount', 'accountName' ]
    })
    @IsOptional()
    @IsEnum(['createdAt', 'lastUsedAt', 'updatedAt', 'dailyApiUseCount', 'accountName'], { message: 'orderBy must be one of createdAt, lastUsedAt, updatedAt, dailyApiUseCount, accountName' })
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
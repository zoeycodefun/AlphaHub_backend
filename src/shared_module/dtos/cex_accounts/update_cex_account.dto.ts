import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsEnum, IsBoolean, IsObject, Length, Matches } from "class-validator";
import { Type } from "class-transformer";
import { PartialType } from "@nestjs/swagger";
import { CreateCexAccountDto } from "./create_cex_account.dto";
/**
 * update DTO for CEX account
 * used for the verification and transformation of the input data when updating an existing CEX account
 * it extends the CreateCexAccountDto, making all fields optional for partial updates
 * do not allow update API key and secret for security reasons
 */
export class UpdateCexAccountDto extends PartialType(CreateCexAccountDto) {
    @ApiPropertyOptional({
        description: 'custom account name',
        example: 'main trade account',
        maxLength: 100
    })
    @IsOptional()
    @IsString({ message: 'account name must be a string' })
    @Length(1, 100, { message: 'account name must be between 1 and 100 characters' })
    accountName?: string;

    @ApiPropertyOptional({
        description: 'account permissions configuration',
        example: ['read', 'trade', 'withdraw', 'transfer'],
        enum: ['read', 'trade', 'withdraw', 'transfer'],
        isArray: true
    })
    @IsOptional()
    permissions?: string[];

    @ApiPropertyOptional({
        description: 'whether allow trade',
        example: true
    })
    @IsOptional()
    @IsBoolean({ message: 'allowTrade must be a boolean' })
    @Type(() => Boolean)
    allowTrade?: boolean;

    @ApiPropertyOptional({
        description: 'whether allow withdraw',
        example: false
    })
    @IsOptional()
    @IsBoolean({ message: 'allowWithdraw must be a boolean' })
    @Type(() => Boolean)
    allowWithdraw?: boolean;
    
    @ApiPropertyOptional({
        description: 'whether allow transfer',
        example: false
    })
    @IsOptional()
    @IsBoolean({ message: 'allowTransfer must be a boolean' })
    @Type(() => Boolean)
    allowTransfer?: boolean;
    
    @ApiPropertyOptional({
        description: 'account status',
        example: 'active',
        enum: ['active', 'inactive', 'suspended', 'expired']
    })
    @IsOptional()
    @IsEnum(['active', 'inactive', 'suspended', 'expired'], { message: 'status must be one of active, inactive, suspended, expired' })
    status?: string;

    @ApiPropertyOptional({
        description: 'whether enable account',
        example: true
    })
    @IsOptional()
    @IsBoolean({ message: 'enabled must be a boolean' })
    @Type(() => Boolean)
    enabled?: boolean;
    
    @ApiPropertyOptional({
        description: 'account configuration, in JSON format',
        example: { 'rateLimit': 1000, 'timeout': 10000 }
    })
    @IsOptional()
    @IsObject({ message: 'configuration must be an object' })
    configuration?: Record<string, any>;

    @ApiPropertyOptional({
        description: 'specific configuration for the CEX account',
        example: { 'apiVersion': 'v4'}
    })
    @IsOptional()
    @IsObject({ message: 'specificConfiguration must be an object' })
    specificConfiguration?: Record<string, any>;
}
// the characters can not be changed: exchang, accountType, accountEnvironment, apiKey, apiSecret, apiPassphrase
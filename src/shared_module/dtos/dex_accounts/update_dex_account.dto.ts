import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsEnum, IsBoolean, IsObject, IsInt, Min, Length } from "class-validator";
import { Type } from "class-transformer";
import { PartialType } from "@nestjs/swagger";
import { CreateDexAccountDto } from "./create_dex_account.dto";
/**
 * update DTO for DEX account
 * used for the verification and transformation of the input data when updating an existing DEX account
 * it extends the CreateDexAccountDto, making all fields optional for partial updates
 * do not allow update wallet address and type for security reasons
 */
export class UpdateDexAccountDto extends PartialType(CreateDexAccountDto) {
    @ApiPropertyOptional({
        description: 'wallet type',
        example: 'trustwallet',
        enum: ['metamask', 'okx', 'trustwallet', 'coinbasewallet', 'phantomwallet', 'other']
    })
    @IsOptional()
    @IsEnum(['metamask', 'okx', 'trustwallet', 'coinbasewallet', 'phantomwallet', 'other'], { message: 'wallet type must be one of the following: metamask, okx, trustwallet, coinbasewallet, phantomwallet, other' })
    walletType?: string;

    @ApiPropertyOptional({
        description: 'wallet provider',
        example: 'MetaMask',
        maxLength: 64
    })
    @IsOptional()
    @IsString({ message: 'wallet provider must be a string' })
    @Length(1, 64, { message: 'wallet provider must be between 1 and 64 characters' })
    walletProvider?: string;

    @ApiPropertyOptional({
        description: 'wallet client version',
        example: 'MetaMask 10.0.0',
        required: false,
        maxLength: 32
    })
    @IsOptional()
    @IsString({ message: 'wallet client version must be a string' })
    @Length(1, 32, { message: 'wallet client version must be between 1 and 32 characters' })
    walletClientVersion?: string;
    
    @ApiPropertyOptional({
        description: 'DEX platform',
        example: 'sushiswap',
        enum: ['hyperliquid', 'uniswap', 'sushiswap', 'pancakeswap', '1inch', 'other']
    })
    @IsOptional()
    @IsEnum(['hyperliquid', 'uniswap', 'sushiswap', 'pancakeswap', '1inch', 'other'], { message: 'DEX platform must be one of the following: hyperliquid, uniswap, sushiswap, pancakeswap, 1inch, other' })
    dexPlatform?: string;

    @ApiPropertyOptional({
        description: 'DEX platform version',
        example: 'v3',
        maxLength: 16
    })
    @IsOptional()
    @IsString({ message: 'DEX platform version must be a string' })
    @Length(1, 16, { message: 'DEX platform version must be between 1 and 16 characters' })
    dexPlatformVersion?: string;
    
    @ApiPropertyOptional({
        description: 'account permissions configuration',
        example: ['read', 'trade', 'swap'],
        enum: ['read', 'trade', 'swap', 'liquidity', 'stake'],
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
        description: 'whether allow liquidity',
        example: false
    })
    @IsOptional()
    @IsBoolean({ message: 'allowLiquidity must be a boolean' })
    @Type(() => Boolean)
    allowLiquidity?: boolean;
    
    @ApiPropertyOptional({
        description: 'whether allow stake',
        example: false
    })
    @IsOptional()
    @IsBoolean({ message: 'allowStake must be a boolean' })
    @Type(() => Boolean)
    allowStake?: boolean;
    
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
        description: 'gas fee reference for DEX transactions.',
        example: 'fast',
        enum: ['slow', 'standard', 'fast', 'instant']
    })
    @IsOptional()
    @IsEnum(['slow', 'standard', 'fast', 'instant'], { message: 'gas fee reference must be one of the following: slow, standard, fast, instant' })
    gasFeeReferenceType?: string;

    @ApiPropertyOptional({
        description: 'gas settings for DEX transactions, in JSON format.',
        example: { 'gasLimit': 250000, 'maxFeePerGas': '60000000000' }
    })
    @IsOptional()
    @IsObject({ message: 'gas settings must be an object' })
    gasSettings?: Record<string, any>;

    @ApiPropertyOptional({
        description: 'additional account configuration for DEX accounts, in JSON format',
        example: { 'slippage': 0.3, 'deadline': 200 },
    })
    @IsOptional()
    @IsObject({ message: 'account configuration must be an object' })
    accountConfiguration?: Record<string, any>;

    @ApiPropertyOptional({
        description: 'additional configuration for DEX accounts, in JSON format',
        example: { 'routers': ['0x32...'], 'protocols': ['v3'] },
    })
    @IsOptional()
    @IsObject({ message: 'additional configuration must be an object' })
    additionalDexConfiguration?: Record<string, any>;

    @ApiPropertyOptional({
        description: 'wallet configuration for DEX accounts, in JSON format',
        example: { 'rpcUrl': 'https://mainnet.infura.io/v3/your-project-id', 'blockchainWebsiteId': 1 },
    })
    @IsOptional()
    @IsObject({ message: 'wallet configuration must be an object' })
    walletConfiguration?: Record<string, any>;

    @ApiPropertyOptional({
        description: 'account label',
        example: ['defi', 'polygon'],
        isArray: true
    })
    @IsOptional()
    tags?: string[];
}
// blockchainWebsiteId and walletAddress can not be changed through DTO update



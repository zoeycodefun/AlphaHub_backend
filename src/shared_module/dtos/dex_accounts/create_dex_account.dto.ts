import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean, IsObject, IsInt, Min, Max, Length, Matches } from "class-validator";
import { Transform, Type } from "class-transformer";
/**
 * create DTO for DEX account
 * used for the verification and transformation of the input data when creating a new DEX account
 * DEX account mainly including the blockchain wallet connection, do not include secret key, except for hyperliquid
 */
export class CreateDexAccountDto {
    @ApiProperty({
        description: 'blockchain website ID',
        example: 1,
        minimum: 1,
    })
    @IsInt({ message: 'blockchain website ID must be an integer' })
    @Min(1, { message: 'blockchain website ID must be more than 0' })
    blockchainWebsiteId: number;

    @ApiProperty({
        description: 'wallet address',
        example: '0x23...'
    })
    @IsString({ message: 'wallet address must be a string' })
    @IsNotEmpty({ message: 'wallet address must not be empty' })
    @Length(20, 128, { message: 'wallet address must be between 20 and 128 characters' })
    @Matches(/^0x[a-fA-F0-9]{40}$|^[1-9A-HJ-NP-Za-km-z]{32,44}$/, { message: 'wallet address is invalid' })
    walletAddress: string;

    @ApiProperty({
        description: 'wallet type',
        example: 'metamask',
        enum: ['metamask', 'okx', 'trustwallet', 'coinbasewallet', 'phantomwallet', 'other']
    })
    @IsEnum(['metamask', 'okx', 'trustwallet', 'coinbasewallet', 'phantomwallet', 'other'], { message: 'wallet type must be one of the following: metamask, okx, trustwallet, coinbasewallet, phantomwallet, other' })
    walletType: string;

    @ApiProperty({
        description: 'wallet provider',
        example: 'MetaMask',
        maxLength: 64
    })
    @IsString({ message: 'wallet provider must be a string' })
    @IsNotEmpty({ message: 'wallet provider must not be empty' })
    @Length(1, 64, { message: 'wallet provider must be between 1 and 64 characters' })
    walletProvider: string;

    @ApiProperty({
        description: 'wallet client version',
        example: 'MetaMask 10.0.0',
        required: false,
        maxLength: 32
    })
    @IsOptional()
    @IsString({ message: 'wallet client version must be a string' })
    @Length(1, 32, { message: 'wallet client version must be between 1 and 32 characters' })
    walletClientVersion: string;

    @ApiProperty({
        description: 'DEX platform',
        example: 'uniswap',
        enum: ['hyperliquid', 'uniswap', 'sushiswap', 'pancakeswap', '1inch', 'other'],
        required: false
    })
    @IsOptional()
    @IsEnum(['hyperliquid', 'uniswap', 'sushiswap', 'pancakeswap', '1inch', 'other'], { message: 'DEX platform must be one of the following: hyperliquid, uniswap, sushiswap, pancakeswap, 1inch, other' })
    dexPlatform: string;

    @ApiProperty({
        description: 'DEX platform version',
        example: 'v3',
        required: false,
        maxLength: 16
    })
    @IsOptional()
    @IsString({ message: 'DEX platform version must be a string' })
    @Length(1, 16, { message: 'DEX platform version must be between 1 and 16 characters' })
    dexPlatformVersion: string;

    @ApiProperty({
        description: 'account permissions configuration',
        example: ['read', 'trade', 'swap'],
        enum: ['read', 'trade', 'swap', 'liquidity', 'stake'],
        isArray: true,
        default: ['read']
    })
    @IsOptional()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return [value];
            }
        }
        return value || ['read'];
    })
    permissions: string[] = ['read'];

    @ApiProperty({
        description: 'whether allow trade',
        example: true, 
        default: false
    })
    @IsOptional()
    @IsBoolean({ message: 'allowTrade must be a boolean' })
    @Type(() => Boolean)
    allowTrade: boolean = false;

    @ApiProperty({
        description: 'whether allow liquidity',
        example: false,
        default: false
    })
    @IsOptional()
    @IsBoolean({ message: 'allowLiquidity must be a boolean' })
    @Type(() => Boolean)
    allowLiquidity: boolean = false;

    @ApiProperty({
        description: 'whether allow stake',
        example: false,
        default: false
    })
    @IsOptional()
    @IsBoolean({ message: 'allowStake must be a boolean' })
    @Type(() => Boolean)
    allowStake: boolean = false;
    
    @ApiProperty({
        description: 'gas fee reference',
        example: 'standard',
        enum: ['slow', 'standard', 'fast', 'instant'],
        default: 'standard'
    })
    @IsOptional()
    @IsEnum(['slow', 'standard', 'fast', 'instant'], { message: 'gas fee reference must be one of the following: slow, standard, fast, instant' })
    gasFeeReference: string = 'standard';

    @ApiProperty({
        description: 'gas settings, in JSON format',
        example: { 'gasLimit': 200000, 'maxFeePerGas': '50000000000' },
        required: false
    })
    @IsOptional()
    @IsObject({ message: 'gas settings must be an object' })
    gasSettings: Record<string, any>;

    @ApiProperty({
        description: 'account configuration, in JSON format',
        example: { 'slippage': 0.5, 'deadline': 300 },
        required: false
    })
    @IsOptional()
    @IsObject({ message: 'account configuration must be an object' })
    accountConfiguration?: Record<string, any>;

    @ApiProperty({
        description: 'specific configuration for the DEX account, in JSON format',
        example: { 'routers': ['0x323...'], 'protocols': ['v2', 'v3'] },
        required: false
    })
    @IsOptional()
    @IsObject({ message: 'specific configuration must be an object' })
    specificDexConfiguration?: Record<string, any>;

    @ApiProperty({
        description: 'wallet configuration, in JSON format',
        example: { 'rpcUrl': 'https://mainnet.infura.io/v3/your-project-id', 'blockchainWebsiteId': 1 },
        required: false
    })
    @IsOptional()
    @IsObject({ message: 'wallet configuration must be an object' })
    walletConfiguration?: Record<string, any>;
    
    @ApiProperty({
        description: 'account label',
        example: ['defi'],
        isArray: true,
        required: false
    })
    @IsOptional()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return [value];
            }
        }
        return value || [];
    })
    tags?: string[];

}

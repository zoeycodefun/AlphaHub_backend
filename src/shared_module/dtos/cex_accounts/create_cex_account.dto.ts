import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean, IsObject, Length, Matches } from "class-validator";
import { Transform, Type } from "class-transformer";
/**
 * create DTO for CEX account
 * used for the verification and transformation of the input data when creating a new CEX account
 * it obeys the rule of minimizing the permissions, only including the necessary characters
 */
export class CreateCexAccountDto {
    @ApiProperty({
        description: 'exchange name, e.g. binance, okx, etc.',
        example: 'binance',
        enum: ['binance', 'okx', 'bybit', 'gate', 'kucoin', 'bitget']
    })
    @IsString({ message: 'exchange must be a string' })
    @IsNotEmpty({ message: 'exchange name must not be empty' })
    @Length(2, 32, { message: 'exchange name must be between 2 and 32 characters' })
    @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'exchange name can only contain letters, numbers, underscores and hyphens' })
    exchange: string;

    @ApiProperty({
        description: 'account type, e.g. spot, futures, etc.',
        example: 'spot',
        enum: ['spot', 'futures']
    })
    @IsEnum(['spot', 'futures'], { message: 'account type must be either spot or futures' })
    accountType: string;

    @ApiProperty({
        description: 'account environment, e.g. live, test, demo, etc.',
        example: 'live',
        enum: ['live', 'test', 'demo'],
        default: 'live'
    })
    @IsEnum(['live', 'test', 'demo'], { message: 'account environment must be either live, test or demo' })
    accountEnvironment: string = 'live';

    @ApiProperty({
        description: 'custom account name for the CEX account, e.g. main trade account, etc.',
        example: 'main trade account',
        maxLength: 100,
    })
    @IsString({ message: 'account name must be a string' })
    @IsNotEmpty({ message: 'account name must not be empty' })
    @Length(1, 100, { message: 'account name must be between 1 and 100 characters' })
    accountName: string;

    @ApiProperty({
        description: 'exchange API key',
        example: '---'
    })
    @IsString({ message: 'API key must be a string' })
    @IsNotEmpty({ message: 'API key must not be empty' })
    @Length(10, 256, { message: 'API key must be between 10 and 256 characters' })
    apiKey: string;

    @ApiProperty({
        description: 'exchange API secret',
        example: '---'
    })
    @IsString({ message: 'API secret must be a string' })
    @IsNotEmpty({ message: 'API secret must not be empty' })
    @Length(10, 256, { message: 'API secret must be between 10 and 256 characters' })
    apiSecret: string;

    @ApiProperty({
        description: 'exchange API passphrase, required for some exchanges like okx',
        example: '---',
        required: false
    })
    @IsOptional()
    @IsString({ message: 'API passphrase must be a string' })
    @Length(0, 256, { message: 'API passphrase must be between 0 and 256 characters' })
    apiPassphrase?: string;

    @ApiProperty({
        description: 'account permissions settings, e.g. read-only, trade, withdraw, etc.',
        example: ['read', 'trade', 'withdraw', 'transfer'],
        enum: ['read', 'trade'],
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
    @IsBoolean({ message: 'allowTrade must be a boolean value' })
    @Type(() => Boolean)
    allowTrade: boolean = false;

    @ApiProperty({
        description: 'whether allow withdraw',
        example: false,
        default: false
    })
    @IsOptional()
    @IsBoolean({ message: 'allowWithdraw must be a boolean value' })
    @Type(() => Boolean)
    allowWithdraw: boolean = false;

    @ApiProperty({
        description: 'whether allow transfer',
        example: false,
        default: false
    })
    @IsOptional()
    @IsBoolean({ message: 'allowTransfer must be a boolean value' })
    @Type(() => Boolean)
    allowTransfer: boolean = false;
    
    @ApiProperty({
        description: 'additional settings for the CEX account, in JSON format, e.g. sub-account name, etc.',
        example: { 'rateLimit': 1000, 'timeout': 5000 },
        required: false
    })
    @IsOptional()
    @IsObject({ message: 'additionalSettings must be an object' })
    additionalSettings?: Record<string, any>;

    @ApiProperty({
        description: 'specific configuration for the CEX account, in JSON format.',
        example: { 'apiVersion': 'v3', 'sandbox': false },
        required: false 
    })
    @IsOptional()
    @IsObject({ message: 'exchange configuration must be an object' })
    exchangeConfiguration?: Record<string, any>;
}


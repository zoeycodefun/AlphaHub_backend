import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards, Request, HttpCode, HttpStatus } from "@nestjs/common";
import { JwtAuthGuard } from "@/user_auth_module/infrastructure/guards/jwt_auth.guard";
import { CexAccountsService } from "../services/cex_accounts.service";
import { CreateCexAccountDto } from "../dtos/cex_accounts/create_cex_account.dto";
import { UpdateCexAccountDto } from "../dtos/cex_accounts/update_cex_account.dto";
import { CexAccountQueryDto } from "../dtos/cex_accounts/cex_account_query.dto";
import { CexAccountResponseDto, CexAccountListResponseDto } from "../dtos/cex_accounts/cex_account_response.dto";
/**
 * basic response format
 */
interface BaseResponse {
    success: boolean;
    message: string;
    timestamp: string;
}
/**
 * response with data
 */
interface DataResponse<T> extends BaseResponse {
    data?: T;
}
/**
 * CEX accounts controller
 * offer RESTful API for managing CEX accounts, including creating, updating, deleting and querying accounts
 */
@UseGuards(JwtAuthGuard)
@Controller('cex-accounts')
export class CexAccountsController {
    constructor(private readonly cexService: CexAccountsService) {}
    // create cex account
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Request() request: any,
        @Body() createDto: CreateCexAccountDto,
    ): Promise<DataResponse<CexAccountResponseDto>> {
        const userId = String(request.user.userId);
        const account = await this.cexService.createCexAccount(userId, createDto);
        return {
            success: true,
            message: 'CEX account created successfully',
            data: account,
            timestamp: new Date().toISOString()
        };
    }
    // query cex accounts list
    @Get()
    async list(
        @Request() request: any,
        @Query() queryDto: CexAccountQueryDto,
    ): Promise<DataResponse<CexAccountListResponseDto>> {
        const userId = String(request.user.userId);
        const accounts = await this.cexService.getCexAccounts(userId, queryDto);
        return {
            success: true,
            message: 'CEX accounts retrieved successfully',
            data: accounts,
            timestamp: new Date().toISOString()
        };
    }
    // get single cex account details
    @Get(':id')
    async details(
        @Request() request: any,
        @Param('id') id: string,
    ): Promise<DataResponse<CexAccountResponseDto>> {
        const userId = String(request.user.userId);
        const account = await this.cexService.getAccountDetailsById(userId, Number(id));
        return {
            success: true,
            message: 'CEX account details retrieved successfully',
            data: account,
            timestamp: new Date().toISOString()
        };
    }
    // update cex account
    @Put(':id')
    async update(
        @Request() request: any,
        @Param('id') id: string,
        @Body() updateDto: UpdateCexAccountDto,
    ): Promise<DataResponse<CexAccountResponseDto>> {
        const userId = String(request.user.userId);
        const account = await this.cexService.updateCexAccount(userId, Number(id), updateDto);
        return {
            success: true,
            message: 'CEX account updated successfully',
            data: account,
            timestamp: new Date().toISOString()
        };
    }
    // soft delete cex account
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(
        @Request() request: any,
        @Param('id') id: string,
    ) {
        const userId = String(request.user.userId);
        await this.cexService.deleteAccountSoft(userId, Number(id));
        return;
    }
    // connection test
    @Post(':id/test-connection')
    async testConnection(
        @Request() request: any,
        @Param('id') id: string,
    ): Promise<DataResponse<{ success: boolean; message: string }>> {
        const userId = String(request.user.userId);
        const result = await this.cexService.testConnection(userId, Number(id));
        return {
            success: result.success,
            message: result.message,
            timestamp: new Date().toISOString()
        };
    }
}


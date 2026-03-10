import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
/**
 * basic pagination DTO
 * offer common pagination parameters for all query DTOs that require pagination
 * support both page-based and cursor-based pagination parameters
 */
export class PaginationDto {
    @ApiPropertyOptional({
        description: 'pagination page number',
        example: 1,
        minimum: 1,
        default: 1
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Page must be an integer' })
    @Min(1, { message: 'Page must be greater than or equal to 1' })
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Number of items per page',
        example: 10,
        minimum: 1,
        maximum: 100,
        default: 10
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Limit must be an integer' })
    @Min(1, { message: 'Limit must be greater than or equal to 1' })
    @Max(100, { message: 'Limit must be less than or equal to 100' })
    limit?: number = 10;

    @ApiPropertyOptional({
        description: 'Offset (optional, can be used instead of page parameter)',
        example: 0,
        minimum: 0
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Offset must be an integer' })
    @Min(0, { message: 'Offset must be greater than or equal to 0' })
    offset?: number;

    getOffset(): number {
        if (this.offset !== undefined) {
            return this.offset;
        }
        return ((this.page || 1) - 1) * (this.limit || 10);
    }

    getLimit(): number {
        return this.limit || 10;
    }
}
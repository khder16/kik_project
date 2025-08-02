import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductFilterDto {
    @ApiPropertyOptional({
        description: 'Product category filter',
        example: 'electronics',
        type: String
    })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiPropertyOptional({
        description: 'Minimum price filter (inclusive)',
        example: 100,
        type: Number,
        minimum: 0
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    minPrice?: number;

    @ApiPropertyOptional({
        description: 'Maximum price filter (inclusive)',
        example: 1000,
        type: Number,
        minimum: 0
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    maxPrice?: number;

    @ApiPropertyOptional({
        description: 'Page number for pagination (default: 1)',
        example: 1,
        type: Number,
        minimum: 1,
        default: 1
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    page: number = 1;

    @ApiPropertyOptional({
        description: 'Number of items per page (default: 10)',
        example: 10,
        type: Number,
        minimum: 1,
        default: 10
    })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    limit: number = 10;
}
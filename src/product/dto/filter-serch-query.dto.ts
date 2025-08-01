import { IsNumber, IsOptional, IsString, Min, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductFilterDto {
    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number) 
    minPrice?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    maxPrice?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    page: number = 1;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    limit: number = 10;
}
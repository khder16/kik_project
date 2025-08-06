import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from "class-transformer";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from "class-validator";
import { CategoryEnum } from "src/common/enum/category.enum";
import { CountryEnum } from "src/common/enum/country.enum";

export class GetStoresFilterDto {
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

    @ApiPropertyOptional({
        description: 'Filter stores by category',
        enum: CategoryEnum,
        example: CategoryEnum.OTHER
    })
    @IsString()
    @IsOptional()
    @IsEnum(CategoryEnum)
    category?: CategoryEnum;

    @ApiPropertyOptional({
        description: 'Filter stores by country',
        enum: CountryEnum,
        example: CountryEnum.NORWAY,
        required: false
    })
    @IsString()
    @IsEnum(CountryEnum, {
        message: `Country must be one of: ${Object.values(CountryEnum).join(', ')}`
    })
    @IsOptional()
    country?: CountryEnum;
}
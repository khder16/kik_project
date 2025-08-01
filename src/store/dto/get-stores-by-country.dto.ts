import { Type } from "class-transformer";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from "class-validator";
import { CategoryEnum } from "src/common/enum/category.enum";
import { CountryEnum } from "src/common/enum/country.enum";




export class GetStoresByCountryDto {


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


    @IsString()
    @IsOptional()
    @IsEnum(CategoryEnum)
    category?: CategoryEnum;

    
    @IsString()
    @IsEnum(CountryEnum, {
        message: `Country must be one of: ${Object.values(CountryEnum).join(', ')}`
    })
    @IsOptional()
    country?: CountryEnum;
}


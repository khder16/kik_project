import { IsEnum, IsIn, IsNotEmpty, IsString } from "class-validator";
import { CountryEnum } from "./signup.dto";




export class CountryDto {
    @IsEnum(CountryEnum)
    @IsNotEmpty()
    country: CountryEnum;
}
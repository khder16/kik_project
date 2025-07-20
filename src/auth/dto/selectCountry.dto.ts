import { IsIn, IsString } from "class-validator";




export class CountryDto {

    @IsIn(['syria', 'norway'], {
        message: 'Country must be either "syria" or "norway"'
    })
    country: 'syria' | 'norway';
}
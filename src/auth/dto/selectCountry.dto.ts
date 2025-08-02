import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from "class-validator";
import { CountryEnum } from "./signup.dto";

export class CountryDto {
    @ApiProperty({
        description: 'Country selection',
        enum: CountryEnum,
        example: CountryEnum.NORWAY,
        required: true
    })
    @IsEnum(CountryEnum, {
        message: `Country must be one of: ${Object.values(CountryEnum).join(', ')}`
    })
    @IsNotEmpty({ message: 'Country selection is required' })
    country: CountryEnum;
}
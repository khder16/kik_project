import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, Matches } from "class-validator";
import { CategoryEnum } from "src/common/enum/category.enum";
import { CountryEnum } from "src/common/enum/country.enum";



export class CreateStoreDto {

    @IsString({ message: 'Store name must be a string.' })
    @IsNotEmpty({ message: 'Store name cannot be empty.' })
    name: string;

    @IsOptional()
    @IsString({ message: 'Description must be a string.' })
    description?: string;

    @IsOptional()
    @IsString({ message: 'Address must be a string.' })
    address?: string;

    @IsOptional()
    @IsString({ message: 'Phone number must be a string.' })
    phoneNumber?: string;

    @IsOptional()
    @IsEmail({}, { message: 'Email must be a valid email address.' }) // Empty object is for validator options, then message
    email?: string;

    @IsOptional()
    @IsUrl({}, { message: 'Facebook URL must be a valid URL.' })
    facebook?: string;

    @IsOptional()
    @IsUrl({}, { message: 'Instagram URL must be a valid URL.' })
    instagram?: string;

    @IsOptional()
    @IsUrl({}, { message: 'WhatsApp URL must be a valid URL.' })
    whatsApp?: string;

    @IsString()
    @IsNotEmpty()
    @IsEnum(CategoryEnum)
    category: CategoryEnum;

    @IsString()
    @IsEnum(CountryEnum, {
        message: `Country must be one of: ${Object.values(CountryEnum).join(', ')}`
    })
    @IsNotEmpty({ message: 'Country Required' })
    country: CountryEnum;
}
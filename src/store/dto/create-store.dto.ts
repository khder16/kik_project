import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, Matches } from "class-validator";
import { CategoryEnum } from "src/common/enum/category.enum";
import { CountryEnum } from "src/common/enum/country.enum";

export class CreateStoreDto {
    @ApiProperty({
        description: 'Name of the store',
        example: 'My Awesome Store',
        required: true
    })
    @IsString({ message: 'Store name must be a string.' })
    @IsNotEmpty({ message: 'Store name cannot be empty.' })
    name: string;

    @ApiPropertyOptional({
        description: 'Store description',
        example: 'We sell high-quality products with great service'
    })
    @IsOptional()
    @IsString({ message: 'Description must be a string.' })
    description?: string;

    @ApiProperty({
        description: 'Physical store address',
        example: '123 Main Street, City'
    })
    @IsNotEmpty()
    @IsString({ message: 'Address must be a string.' })
    address: string;

    @ApiProperty({
        description: 'Contact phone number',
        example: '+1234567890'
    })
    @IsNotEmpty()
    @IsString({ message: 'Phone number must be a string.' })
    phoneNumber: string;

    @ApiProperty({
        description: 'Contact email address',
        example: 'contact@store.com',
        format: 'email'
    })
    @IsNotEmpty()
    @IsEmail({}, { message: 'Email must be a valid email address.' })
    email: string;

    @ApiPropertyOptional({
        description: 'Facebook page URL',
        example: 'https://facebook.com/mystore',
        format: 'url'
    })
    @IsOptional()
    @IsUrl({}, { message: 'Facebook URL must be a valid URL.' })
    facebook?: string;

    @ApiPropertyOptional({
        description: 'Instagram profile URL',
        example: 'https://instagram.com/mystore',
        format: 'url'
    })
    @IsOptional()
    @IsUrl({}, { message: 'Instagram URL must be a valid URL.' })
    instagram?: string;

    @ApiPropertyOptional({
        description: 'WhatsApp contact URL',
        example: 'https://wa.me/1234567890',
        format: 'url'
    })
    @IsOptional()
    @IsUrl({}, { message: 'WhatsApp URL must be a valid URL.' })
    whatsApp?: string;

    @ApiProperty({
        description: 'Store category',
        enum: CategoryEnum,
        example: CategoryEnum.BUILDINGS,
        required: true
    })
    @IsString()
    @IsNotEmpty()
    @IsEnum(CategoryEnum)
    category: CategoryEnum;

    @ApiProperty({
        description: 'Store country location',
        enum: CountryEnum,
        example: CountryEnum.SYRIA,
        required: true
    })
    @IsString()
    @IsEnum(CountryEnum, {
        message: `Country must be one of: ${Object.values(CountryEnum).join(', ')}`
    })
    @IsNotEmpty({ message: 'Country Required' })
    country: CountryEnum;
}
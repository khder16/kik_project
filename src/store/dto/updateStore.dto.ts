import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator";
import { CategoryEnum } from "src/common/enum/category.enum";
import { CountryEnum } from "src/user/schemas/user.schema";

export class UpdateStoreDto {
    @ApiPropertyOptional({
        description: 'Updated store name',
        example: 'Premium Store',
        type: String
    })
    @IsString({ message: 'Store name must be a string.' })
    @IsNotEmpty({ message: 'Store name cannot be empty.' })
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({
        description: 'Updated store description',
        example: 'We provide high-quality products',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'Description must be a string.' })
    description?: string;

    @ApiPropertyOptional({
        description: 'Updated physical address',
        example: '123 Business Ave, City',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'Address must be a string.' })
    address?: string;

    @ApiPropertyOptional({
        description: 'Updated contact number',
        example: '+1234567890',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'Phone number must be a string.' })
    phoneNumber?: string;

    @ApiPropertyOptional({
        description: 'Updated contact email',
        example: 'contact@store.com',
        format: 'email'
    })
    @IsOptional()
    @IsEmail({}, { message: 'Email must be a valid email address.' })
    email?: string;

    @ApiPropertyOptional({
        description: 'Updated Facebook page URL',
        example: 'https://facebook.com/mystore',
        format: 'url'
    })
    @IsOptional()
    @IsUrl({}, { message: 'Facebook URL must be a valid URL.' })
    facebook?: string;

    @ApiPropertyOptional({
        description: 'Updated Instagram profile URL',
        example: 'https://instagram.com/mystore',
        format: 'url'
    })
    @IsOptional()
    @IsUrl({}, { message: 'Instagram URL must be a valid URL.' })
    instagram?: string;

    @ApiPropertyOptional({
        description: 'Updated WhatsApp contact URL',
        example: 'https://wa.me/1234567890',
        format: 'url'
    })
    @IsOptional()
    @IsUrl({}, { message: 'WhatsApp URL must be a valid URL.' })
    whatsApp?: string;

    @ApiPropertyOptional({
        description: 'Updated store category',
        enum: CategoryEnum,
        example: CategoryEnum.PLANTS
    })
    @IsString()
    @IsEnum(CategoryEnum)
    @IsOptional()
    category?: CategoryEnum;

    @ApiPropertyOptional({
        description: 'Updated store country location',
        enum: CountryEnum,
        example: CountryEnum.SYRIA
    })
    @IsString()
    @IsOptional()
    @IsEnum(CountryEnum, {
        message: `Country must be one of: ${Object.values(CountryEnum).join(', ')}`
    })
    country?: CountryEnum;

    @ApiPropertyOptional({
        description: 'Updated store image URL',
        example: 'https://example.com/store-image.jpg',
        type: String
    })
    @IsString()
    @IsOptional()
    image?: string;
}
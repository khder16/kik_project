import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsString, IsNotEmpty, Min, IsOptional, MaxLength, Max, IsEnum } from 'class-validator';

export enum ProductCategory {
    PLANTS = 'plants',
    CARS = 'cars',
    BUILDINGS = 'buildings',
    OTHER = 'other',
}

export class AddNewProductDto {
    @ApiPropertyOptional({
        description: 'Product name in English (required)',
        example: 'Premium Plant',
        maxLength: 100
    })
    @IsString({ message: 'Name (English) must be a string' })
    @IsOptional()
    @MaxLength(100, { message: 'Name cannot be longer than 100 characters' })
    name_en?: string;

    @ApiPropertyOptional({
        description: 'Product name in Arabic',
        example: 'نبات ممتاز',
        maxLength: 100
    })
    @IsString({ message: 'Name (Arabic) must be a string' })
    @IsOptional()
    @MaxLength(100, { message: 'Name cannot be longer than 100 characters' })
    name_ar?: string;

    @ApiPropertyOptional({
        description: 'Product name in Norwegian',
        example: 'Premium Plante',
        maxLength: 100
    })
    @IsOptional()
    @IsString({ message: 'Name (Norwegian) must be a string' })
    @MaxLength(100, { message: 'Name cannot be longer than 100 characters' })
    name_no?: string;

    @ApiProperty({
        description: 'Product price (automatically converted to number)',
        example: 49.99,
        type: Number,
        minimum: 0,
        maximum: 1000000
    })
    @Transform(({ value }) => Number(value))
    @IsNumber({}, { message: 'Price must be a number' })
    @Min(0, { message: 'Price cannot be negative' })
    @Max(1000000, { message: 'Price cannot exceed 1,000,000' })
    price: number;

    @ApiProperty({
        description: 'Available stock quantity (automatically converted to number)',
        example: 100,
        type: Number,
        minimum: 0,
        maximum: 1000000
    })
    @Transform(({ value }) => Number(value))
    @IsNumber({}, { message: 'Stock must be a number' })
    @Min(0, { message: 'Stock cannot be negative' })
    @Max(1000000, { message: 'Stock cannot exceed 1,000,000' })
    stockQuantity: number;

    @ApiProperty({
        description: 'Product category',
        enum: ProductCategory,
        example: ProductCategory.PLANTS,
        required: true
    })
    @IsString({ message: 'Category must be a string' })
    @IsNotEmpty({ message: 'Category is required' })
    @IsEnum(ProductCategory)
    category: ProductCategory;

    @ApiPropertyOptional({
        description: 'Product description in Arabic',
        example: 'وصف المنتج باللغة العربية',
        maxLength: 700
    })
    @IsString({ message: 'Description (Arabic) must be a string' })
    @IsOptional()
    @MaxLength(700, { message: 'Description cannot be longer than 700 characters' })
    description_ar?: string;

    @ApiPropertyOptional({
        description: 'Product description in English',
        example: 'High-quality premium plant',
        maxLength: 700
    })
    @IsString({ message: 'Description (English) must be a string' })
    @IsOptional()
    @MaxLength(700, { message: 'Description cannot be longer than 700 characters' })
    description_en?: string;

    @ApiPropertyOptional({
        description: 'Product description in Norwegian',
        example: 'Høy kvalitet premium plante',
        maxLength: 700
    })
    @IsString({ message: 'Description (Norwegian) must be a string' })
    @IsOptional()
    @MaxLength(700, { message: 'Description cannot be longer than 700 characters' })
    description_no?: string;
}
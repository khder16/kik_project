import { Transform } from 'class-transformer'
import { IsNumber, IsString, IsNotEmpty, Min, IsOptional, MaxLength, Max, IsEnum } from 'class-validator';



export enum ProductCategory {
    PLANTS = 'plants',
    CARS = 'cars',
    BUILDINGS = 'buildings',
    OTHER = 'other',
}


export class ProductDto {
    @IsString({ message: 'Name (English) must be a string' })
    @IsNotEmpty({ message: 'Name (English) is required' })
    @MaxLength(100, { message: 'name cannot be longer than 100 characters.' })
    name_en?: string;

    @IsString({ message: 'Name (Arabic) must be a string' })
    @IsOptional()
    @MaxLength(100, { message: 'name cannot be longer than 100 characters.' })
    name_ar?: string;

    @IsOptional()
    @IsString({ message: 'Name (Norwegian) must be a string' })
    @MaxLength(100, { message: 'name cannot be longer than 100 characters.' })
    name_no?: string;

    @Transform(({ value }) => Number(value))
    @IsNumber({}, { message: 'Price must be a number' })
    @Min(0, { message: 'Price cannot be negative' })
    @Max(1000000, { message: 'Stock cannot exceed 1000' })
    price: number;


    @Transform(({ value }) => Number(value))
    @IsNumber({}, { message: 'Stock must be a number' })
    @Min(0, { message: 'Stock cannot be negative' })
    @Max(1000000, { message: 'Stock cannot exceed 1000' })
    stockQuantity: number;

    @IsString({ message: 'Category must be a string' })
    @IsNotEmpty({ message: 'Category is required' })
    @IsEnum(ProductCategory)
    category: ProductCategory;

    @IsString({ message: 'Description (Arabic) must be a string' })
    @IsOptional()
    @MaxLength(700, { message: 'name cannot be longer than 100 characters.' })
    description_ar?: string

    @IsString({ message: 'Description (English) must be a string' })
    @IsOptional()
    @MaxLength(700, { message: 'name cannot be longer than 100 characters.' })
    description_en?: string

    @IsString({ message: 'Description (Norway) must be a string' })
    @IsOptional()
    @MaxLength(700, { message: 'name cannot be longer than 100 characters.' })
    description_no?: string

}

import { Transform } from 'class-transformer'
import { IsNumber, IsString, IsNotEmpty, Min, IsOptional, IsEnum } from 'class-validator';
import { ProductCategory } from 'src/product/schemas/product.schema';



export class UpdateProductDto {
    @IsString({ message: 'Name (English) must be a string' })
    @IsNotEmpty({ message: 'Name (English) is required' })
    @IsOptional()
    name_en?: string;

    @IsString({ message: 'Name (Arabic) must be a string' })
    @IsNotEmpty({ message: 'Name (Arabic) is required' })
    @IsOptional()
    name_ar?: string;

    @IsOptional()
    @IsString({ message: 'Name (Norwegian) must be a string' })
    name_no?: string;

    @Transform(({ value }) => Number(value))
    @IsNumber({}, { message: 'Price must be a number' })
    @Min(0, { message: 'Price cannot be negative' })
    @IsOptional()
    price: number;


    @Transform(({ value }) => Number(value))
    @IsNumber({}, { message: 'Stock must be a number' })
    @Min(0, { message: 'Stock cannot be negative' })
    @IsOptional()
    stockQuantity: number;

    @IsString({ message: 'Category must be a string' })
    @IsNotEmpty({ message: 'Category is required' })
    @IsEnum(ProductCategory)
    category: ProductCategory;

    @IsString({ message: 'Description (Arabic) must be a string' })
    @IsOptional()
    description_ar?: string

    @IsString({ message: 'Description (English) must be a string' })
    @IsOptional()
    description_en?: string

    @IsString({ message: 'Description (Norway) must be a string' })
    @IsOptional()
    description_no?: string

}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNumber,
  IsString,
  IsNotEmpty,
  Min,
  IsOptional,
  IsEnum
} from 'class-validator';
import { CategoryEnum } from 'src/common/enum/category.enum';

export class UpdateProductDto {
  @ApiPropertyOptional({
    description: 'Product name in English',
    example: 'Premium Plant',
    type: String
  })
  @IsString({ message: 'Name (English) must be a string' })
  @IsNotEmpty({ message: 'Name (English) is required' })
  @IsOptional()
  name_en?: string;

  @ApiPropertyOptional({
    description: 'Product name in Arabic',
    example: 'نبات ممتاز',
    type: String
  })
  @IsString({ message: 'Name (Arabic) must be a string' })
  @IsNotEmpty({ message: 'Name (Arabic) is required' })
  @IsOptional()
  name_ar?: string;

  @ApiPropertyOptional({
    description: 'Product name in Norwegian',
    example: 'Premium Plante',
    type: String
  })
  @IsOptional()
  @IsString({ message: 'Name (Norwegian) must be a string' })
  name_no?: string;

  @ApiPropertyOptional({
    description: 'Product price (will be converted to number)',
    example: 49.99,
    type: Number,
    minimum: 0
  })
  @Transform(({ value }) => Number(value))
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price cannot be negative' })
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({
    description: 'Available stock quantity (will be converted to number)',
    example: 100,
    type: Number,
    minimum: 0
  })
  @Transform(({ value }) => Number(value))
  @IsNumber({}, { message: 'Stock must be a number' })
  @Min(0, { message: 'Stock cannot be negative' })
  @IsOptional()
  stockQuantity?: number;

  @ApiPropertyOptional({
    description: 'Product category',
    enum: CategoryEnum,
    example: CategoryEnum.PLANTS
  })
  @IsString({ message: 'Category must be a string' })
  @IsNotEmpty({ message: 'Category is required' })
  @IsOptional()
  @IsEnum(CategoryEnum)
  category?: CategoryEnum;

  @ApiPropertyOptional({
    description: 'Product description in Arabic',
    example: 'وصف المنتج باللغة العربية',
    type: String
  })
  @IsString({ message: 'Description (Arabic) must be a string' })
  @IsOptional()
  description_ar?: string;

  @ApiPropertyOptional({
    description: 'Product description in English',
    example: 'High-quality premium plant',
    type: String
  })
  @IsString({ message: 'Description (English) must be a string' })
  @IsOptional()
  description_en?: string;

  @ApiPropertyOptional({
    description: 'Product description in Norwegian',
    example: 'Høy kvalitet premium plante',
    type: String
  })
  @IsString({ message: 'Description (Norwegian) must be a string' })
  @IsOptional()
  description_no?: string;

  @IsOptional()
  images: string[];
}

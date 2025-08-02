import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class AddToCartDto {
    @ApiProperty({
        description: 'Valid MongoDB ID of the product to add to cart',
        example: '507f1f77bcf86cd799439011',
        format: 'mongo-id',
        required: true
    })
    @IsNotEmpty({ message: 'Product ID is required' })
    @IsMongoId({ message: 'Invalid product ID format' })
    productId: string;

    @ApiProperty({
        description: 'Quantity of the product to add (minimum 1)',
        example: 1,
        minimum: 1,
        default: 1,
        required: true
    })
    @IsNumber({}, { message: 'Quantity must be a number' })
    @Min(1, { message: 'Quantity must be at least 1' })
    quantity: number;
}
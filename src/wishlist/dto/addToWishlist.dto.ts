import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from "class-validator";

export class AddToWishlistDto {
    @ApiProperty({
        description: 'MongoDB ObjectId of the product to add to wishlist',
        example: '507f1f77bcf86cd799439011',
        format: 'mongo-id',
        required: true
    })
    @IsNotEmpty({ message: 'productId must be provided' })
    @IsMongoId({ message: 'productId must be a valid MongoDB ObjectId' })
    productId: string;
}
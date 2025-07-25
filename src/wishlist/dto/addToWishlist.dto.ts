import { IsMongoId, IsNotEmpty } from "class-validator";



export class AddToWishlistDto {

    @IsNotEmpty({ message: 'productId must be provided' })
    @IsMongoId({ message: 'productId must be a valid MongoDB ObjectId' })
    productId: string;

}
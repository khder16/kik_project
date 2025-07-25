import { IsMongoId, IsNotEmpty, IsNumber, Min } from 'class-validator';


export class AddToCartDto {
    @IsNotEmpty()
    @IsMongoId()
    productId: string;

    @IsNumber()
    @Min(1)
    quantity: number;
}
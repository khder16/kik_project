import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';


export class UpdateCartItemDto {

    @ApiProperty({
        description: 'Quantity of the product to add (minimum 1)',
        example: 1,
        minimum: 1,
        default: 1,
        required: true
    })
    @IsNumber({}, { message: 'Quantity must be a number' })
    @Min(0, { message: 'Quantity must be at least 1' })
    quantity: number;
} 
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class CreateReviewDto {
    @ApiPropertyOptional({
        description: 'Star rating (1-5)',
        example: 5,
        type: Number,
        minimum: 1,
        maximum: 5,
        required: false
    })
    @IsInt()
    @Min(1)
    @Max(5)
    @IsOptional()
    stars?: number;

    @ApiPropertyOptional({
        description: 'Review comments (max 1000 characters)',
        example: 'This product exceeded my expectations!',
        type: String,
        maxLength: 1000,
        required: false
    })
    @IsString()
    @MaxLength(1000)
    @IsOptional()
    comments?: string;
}
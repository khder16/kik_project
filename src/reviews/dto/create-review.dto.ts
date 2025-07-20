import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";


export class CreateReviewDto {
    @IsInt()
    @Min(1)
    @Max(5)
    @IsOptional()
    stars?: number;

    @IsString()
    @MaxLength(1000)
    @IsOptional()
    comments?: string;
}



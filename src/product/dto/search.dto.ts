import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive, IsString, Min, MinLength } from 'class-validator';

export class SearchDto {

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Search term must be at least 2 characters' })
  search?: string;


  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  limit?: number= 10;;

  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;
}
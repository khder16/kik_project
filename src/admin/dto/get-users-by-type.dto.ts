import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min
} from 'class-validator';
import { UserRole } from 'src/user/schemas/user.schema';

export class getUsersByTypeQuery {
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsEnum(UserRole)
  @IsString()
  role: string;
}

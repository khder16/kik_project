import { IsEmail, IsNotEmpty, MaxLength } from "class-validator";
import { Transform } from "class-transformer";



export class EmailDto {
    @IsEmail({}, { message: 'Please provide a valid email address.' })
    @IsNotEmpty({ message: 'Email cannot be empty.' })
    @MaxLength(100, { message: 'Email cannot be longer than 100 characters.' })
    @Transform(({ value }) => value.toLowerCase())
    email: string;
}
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { Transform } from "class-transformer";

export class LoginDto {
    @IsOptional()
    @IsEmail({}, { message: 'Please provide a valid email address.' })
    @IsNotEmpty({ message: 'Email cannot be empty.' })
    @MaxLength(100, { message: 'Email cannot be longer than 100 characters.' })
    @Transform(({ value }) => value.toLowerCase())
    email?: string;

    @IsOptional()
    @IsString()
    @MinLength(10, { message: 'Phone number must be at least 10 characters long.' })
    @MaxLength(15, { message: 'Phone number cannot be longer than 15 characters.' })
    phoneNumber?: string;


    @IsString({ message: 'Password must be a string.' })
    @IsNotEmpty({ message: 'Password cannot be empty.' })
    @MinLength(8, { message: 'Password must be at least 8 characters long.' })
    @MaxLength(50, { message: 'Password cannot be longer than 50 characters.' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,50}$/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    })
    password: string;
}
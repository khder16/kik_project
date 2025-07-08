import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength, IsEnum, IsPhoneNumber, IsLowercase } from "class-validator";
import { UserRole } from "../schemas/user.schema";
import { Transform } from "class-transformer";


export class CreateUserDto {
    @IsEmail({}, { message: 'Please provide a valid email address.' })
    @IsNotEmpty({ message: 'Email cannot be empty.' })
    @MaxLength(100, { message: 'Email cannot be longer than 100 characters.' })
    @Transform(({ value }) => value.toLowerCase())
    email: string;

    @IsString({ message: 'Password must be a string.' })
    @IsNotEmpty({ message: 'Password cannot be empty.' })
    @MinLength(8, { message: 'Password must be at least 8 characters long.' })
    @MaxLength(50, { message: 'Password cannot be longer than 50 characters.' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,50}$/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    })
    password: string;

    @IsOptional()
    @IsString({ message: 'First name must be a string.' })
    @IsNotEmpty({ message: 'First name cannot be empty if provided.' })
    @MaxLength(50, { message: 'First name cannot be longer than 50 characters.' })
    firstName?: string;

    @IsOptional()
    @IsString({ message: 'Last name must be a string.' })
    @IsNotEmpty({ message: 'Last name cannot be empty if provided.' })
    @MaxLength(50, { message: 'Last name cannot be longer than 50 characters.' })
    lastName?: string;

    @IsOptional()
    @IsString({ message: 'Phone number must be a string.' })
    @Matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,3}[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,4}$/, {
        message: 'Please provide a valid phone number if provided.'
    })
    phoneNumber?: string;

    @IsOptional()
    @IsString({ message: 'Google ID must be a string.' })
    @IsNotEmpty({ message: 'Google ID cannot be empty if provided.' })
    @MaxLength(255, { message: 'Google ID cannot be longer than 255 characters.' })
    googleId?: string;

    @IsOptional()
    @IsString({ message: 'Facebook ID must be a string.' })
    @IsNotEmpty({ message: 'Facebook ID cannot be empty if provided.' })
    @MaxLength(255, { message: 'Facebook ID cannot be longer than 255 characters.' })
    facebookId?: string;

    @IsOptional()
    isEmailVerified?: boolean;


    @IsOptional()
    @IsEnum(UserRole, { message: 'Invalid user role.' })
    role?: UserRole;
}
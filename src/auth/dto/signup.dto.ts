import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MinLength,
    MaxLength,
    Matches,
    IsOptional,
    IsEnum,
} from 'class-validator';
import { Transform } from "class-transformer";

export enum UserRole {
    NORMAL_USER = 'normal_user',
    SELLER = 'seller',
    ADMIN = 'admin',
    SUPER_ADMIN = 'super_admin',
}

export enum CountryEnum {
    SYRIA = 'syria',
    NORWAY = 'norway'
}

export class SignUpDto {
    @ApiProperty({
        description: 'User email address (will be converted to lowercase)',
        example: 'user@example.com',
        maxLength: 100,
        format: 'email'
    })
    @IsEmail({}, { message: 'Please provide a valid email address.' })
    @IsNotEmpty({ message: 'Email cannot be empty.' })
    @MaxLength(100, { message: 'Email cannot be longer than 100 characters.' })
    @Transform(({ value }) => value.toLowerCase())
    email: string;

    @ApiProperty({
        description: 'User password (must contain uppercase, lowercase, number, and special character)',
        example: 'SecurePassword123!',
        minLength: 8,
        maxLength: 50,
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?]).{8,50}$'
    })
    @IsString({ message: 'Password must be a string.' })
    @IsNotEmpty({ message: 'Password cannot be empty.' })
    @MinLength(8, { message: 'Password must be at least 8 characters long.' })
    @MaxLength(50, { message: 'Password cannot be longer than 50 characters.' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,50}$/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    })
    password: string;

    @ApiProperty({
        description: 'User first name',
        example: 'John',
        maxLength: 50
    })
    @IsString({ message: 'First name must be a string.' })
    @IsNotEmpty({ message: 'First name cannot be empty when provided.' })
    @MaxLength(50, { message: 'First name cannot be longer than 50 characters.' })
    firstName: string;

    @ApiProperty({
        description: 'User last name',
        example: 'Doe',
        maxLength: 50
    })
    @IsString({ message: 'Last name must be a string.' })
    @IsNotEmpty({ message: 'Last name cannot be empty when provided.' })
    @MaxLength(50, { message: 'Last name cannot be longer than 50 characters.' })
    lastName: string;

    @ApiProperty({
        description: 'User phone number',
        example: '+1234567890',
        minLength: 10,
        maxLength: 15
    })
    @IsNotEmpty({ message: 'Phone number cannot be empty when provided.' })
    @IsString()
    @MinLength(10, { message: 'Phone number must be at least 10 characters long.' })
    @MaxLength(15, { message: 'Phone number cannot be longer than 15 characters.' })
    phoneNumber: string;

    @ApiPropertyOptional({
        description: 'Google authentication ID',
        example: 'google-auth-id-123',
        maxLength: 255,
        required: false
    })
    @IsOptional()
    @IsString({ message: 'Google ID must be a string.' })
    @IsNotEmpty({ message: 'Google ID cannot be empty when provided.' })
    @MaxLength(255, { message: 'Google ID cannot be longer than 255 characters.' })
    googleId?: string;

    @ApiPropertyOptional({
        description: 'Facebook authentication ID',
        example: 'facebook-auth-id-123',
        maxLength: 255,
        required: false
    })
    @IsOptional()
    @IsString({ message: 'Facebook ID must be a string.' })
    @IsNotEmpty({ message: 'Facebook ID cannot be empty when provided.' })
    @MaxLength(255, { message: 'Facebook ID cannot be longer than 255 characters.' })
    facebookId?: string;

    @ApiPropertyOptional({
        description: 'User role',
        enum: UserRole,
        example: UserRole.NORMAL_USER,
        default: UserRole.NORMAL_USER
    })
    @IsEnum(UserRole, {
        message: `Role must be one of: ${Object.values(UserRole).join(', ')}`
    })
    @IsString()
    role?: UserRole;

    @ApiProperty({
        description: 'User country',
        enum: CountryEnum,
        example: CountryEnum.NORWAY
    })
    @IsString()
    @IsEnum(CountryEnum, {
        message: `Country must be one of: ${Object.values(CountryEnum).join(', ')}`
    })
    country?: CountryEnum;
}
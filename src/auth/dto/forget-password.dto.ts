import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength, Matches } from "class-validator";

export class ForgetPasswordDto {
    @ApiProperty({
        description: 'Registered email address for password reset',
        example: 'user@example.com',
        maxLength: 100,
        format: 'email',
        required: true
    })
    @IsEmail({}, { message: 'Please provide a valid email address.' })
    @IsNotEmpty({ message: 'Email cannot be empty.' })
    @MaxLength(100, { message: 'Email cannot be longer than 100 characters.' })
    email: string;

    @ApiProperty({
        description: 'New password (must contain uppercase, lowercase, number and special character)',
        example: 'NewSecurePassword123!',
        minLength: 8,
        maxLength: 50,
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?]).{8,50}$',
        required: true
    })
    @IsString({ message: 'Password must be a string.' })
    @IsNotEmpty({ message: 'Password cannot be empty.' })
    @MinLength(8, { message: 'Password must be at least 8 characters long.' })
    @MaxLength(50, { message: 'Password cannot be longer than 50 characters.' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,50}$/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    })
    password: string;
}
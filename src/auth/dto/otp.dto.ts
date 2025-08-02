import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length, Matches } from "class-validator";

export class OtpDto {
    @ApiProperty({
        description: '6-digit OTP code (numbers only)',
        example: '123456',
        minLength: 6,
        maxLength: 6,
        pattern: '^\\d+$'
    })
    @IsString()
    @IsNotEmpty({ message: 'OTP cannot be empty when provided.' })
    @Matches(/^\d+$/, { message: 'OTP must contain only numbers.' })
    @Length(6, 6, { message: 'OTP must be exactly 6 digits long.' })
    code: string;

    @ApiProperty({
        description: 'Email address associated with the OTP',
        example: 'user@example.com',
        format: 'email'
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}
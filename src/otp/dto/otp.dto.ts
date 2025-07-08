import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class OtpDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'OTP cannot be empty when provided.' })
    @Length(6, 6)
    code: string;
}
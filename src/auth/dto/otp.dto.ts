import { IsEmail, IsNotEmpty, IsString, Length, Matches } from "class-validator";


export class OtpDto {
    @IsString()
    @IsNotEmpty({ message: 'OTP cannot be empty when provided.' })
    @Matches(/^\d+$/, { message: 'OTP must contain only numbers.' })
    @Length(6, 6)
    code: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

}
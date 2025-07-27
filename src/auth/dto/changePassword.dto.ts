import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator";




export class ChangePasswordDto {
    @IsString({ message: 'Password must be a string.' })
    @IsNotEmpty({ message: 'Password cannot be empty.' })
    @MinLength(8, { message: 'Password must be at least 8 characters long.' })
    @MaxLength(50, { message: 'Password cannot be longer than 50 characters.' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,50}$/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    })
    newPassword: string;

    @IsString({ message: 'Password must be a string.' })
    @IsNotEmpty({ message: 'Password cannot be empty.' })
    @MinLength(8, { message: 'Password must be at least 8 characters long.' })
    @MaxLength(50, { message: 'Password cannot be longer than 50 characters.' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,50}$/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    })
    confirmNewPassword: string;

}
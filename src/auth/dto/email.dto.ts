import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength } from "class-validator";
import { Transform } from "class-transformer";

export class EmailDto {
    @ApiProperty({
        description: 'The email address of the user',
        example: 'user@example.com',
        maxLength: 100,
        format: 'email',
        required: true
    })
    @IsEmail({}, { message: 'Please provide a valid email address.' })
    @IsNotEmpty({ message: 'Email cannot be empty.' })
    @MaxLength(100, { message: 'Email cannot be longer than 100 characters.' })
    @Transform(({ value }) => value.toLowerCase())
    email: string;
}
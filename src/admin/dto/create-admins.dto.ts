import {
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength
} from 'class-validator';

import { Transform } from 'class-transformer';
import { CountryEnum } from 'src/user/schemas/user.schema';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminsDto {
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
    description:
      'User password (must contain uppercase, lowercase, number, and special character)',
    example: 'SecurePassword123!',
    minLength: 8,
    maxLength: 50,
    pattern:
      '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?]).{8,50}$'
  })
  @IsString({ message: 'Password must be a string.' })
  @IsNotEmpty({ message: 'Password cannot be empty.' })
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @MaxLength(50, { message: 'Password cannot be longer than 50 characters.' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,50}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
    }
  )
  password: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    maxLength: 50
  })
  @IsOptional()
  @IsString({ message: 'First name must be a string.' })
  @IsNotEmpty({ message: 'First name cannot be empty if provided.' })
  @MaxLength(50, { message: 'First name cannot be longer than 50 characters.' })
  firstName?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    maxLength: 50
  })
  @IsOptional()
  @IsString({ message: 'Last name must be a string.' })
  @IsNotEmpty({ message: 'Last name cannot be empty if provided.' })
  @MaxLength(50, { message: 'Last name cannot be longer than 50 characters.' })
  lastName?: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+1234567890',
    minLength: 10,
    maxLength: 15
  })
  @IsOptional()
  @IsString({ message: 'Phone number must be a string.' })
  @Matches(
    /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,3}[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,4}$/,
    {
      message: 'Please provide a valid phone number if provided.'
    }
  )
  phoneNumber?: string;

  @IsOptional()
  @IsString({ message: 'Google ID must be a string.' })
  @IsNotEmpty({ message: 'Google ID cannot be empty if provided.' })
  @MaxLength(255, {
    message: 'Google ID cannot be longer than 255 characters.'
  })
  googleId?: string;

  @IsOptional()
  @IsString({ message: 'Facebook ID must be a string.' })
  @IsNotEmpty({ message: 'Facebook ID cannot be empty if provided.' })
  @MaxLength(255, {
    message: 'Facebook ID cannot be longer than 255 characters.'
  })
  facebookId?: string;

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



  @IsOptional()
  @IsIn(['admin'], { message: 'Role can only be set to "admin".' })
  @Transform(() => 'admin')
  role?: string;
}

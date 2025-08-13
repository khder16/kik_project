import { Controller, Post, Body, Res, HttpStatus, UseGuards, Request, Req, InternalServerErrorException, Get, ConflictException, HttpException, Query, BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CountryEnum, SignUpDto, UserRole } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { minutes, Throttle } from '@nestjs/throttler';
import { EmailDto } from './dto/email.dto';
import { OtpDto } from './dto/otp.dto';
import { OtpService } from 'src/otp/otp.service';
import { UserService } from 'src/user/user.service';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { User } from 'src/user/schemas/user.schema';
import { NotFoundError } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/authentication.guard';
import { CountryDto } from './dto/selectCountry.dto';
import { UserDecorator } from 'src/common/decorators/userId.decorator';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';





@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService, private readonly otpService: OtpService, private userService: UserService) { }

    @Post('signup')
    @Throttle({ default: { ttl: minutes(60), limit: 8 } })
    @ApiOperation({ summary: 'Register a new user' })
    @ApiBody({
        type: SignUpDto,
        description: '[BODY] User registration data',
        examples: {
            basic: {
                value: {
                    email: 'user@example.com',
                    password: 'SecurePass123!',
                    firstName: 'John',
                    lastName: 'Doe',
                    phoneNumber: '+1234567890',
                    country: CountryEnum.NORWAY,
                    role: UserRole.NORMAL_USER
                }
            }
        }
    })
    @ApiResponse({ status: 201, description: 'User created successfully' })
    @ApiResponse({ status: 409, description: 'Email already exists' })
    async signUp(@Body() signUpDto: SignUpDto, @Res() res: Response) {
        try {
            const result = await this.authService.signUp(signUpDto, res);
            return res.status(HttpStatus.CREATED).json({
                statusCode: HttpStatus.CREATED,
                message: 'User created successfully',
                user: result.user
            });
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            throw new InternalServerErrorException('An unexpected error occurred during signup.');
        }
    }


    @Post('login')
    @Throttle({ default: { ttl: minutes(5), limit: 10 } })
    @ApiOperation({ summary: 'Authenticate user' })
    @ApiBody({
        type: LoginDto,
        description: '[BODY] Login credentials',
        examples: {
            basic: {
                value: {
                    email: 'user@example.com',
                    password: 'SecurePass123!'
                }
            }
        }
    })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
        try {
            const result = await this.authService.login(loginDto, res);
            if (!result) {
                throw new NotFoundException('User Not Found')
            }
            return {
                statusCode: HttpStatus.OK,
                message: 'Login successful',
                user: {
                    firstName: result.user.firstName,
                    lastName: result.user.lastName,
                }
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('An unexpected error occurred during login.');
        }
    }



    @Get('google')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Initiate Google OAuth flow' })
    @ApiResponse({ status: 302, description: 'Redirects to Google for authentication' })
    async googleAuth(@Req() req) { }



    @Get('google/redirect')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Google OAuth callback' })
    @ApiQuery({
        name: 'userType',
        description: '[QUERY] Optional user type (normal_user or seller)',
        enum: UserRole,
        required: false
    })
    @ApiResponse({ status: 302, description: 'Redirects to home page with auth cookie' })
    @ApiResponse({ status: 400, description: 'Invalid user type' })
    async googleAuthRedirect(@Req() req, @Res() res: Response, @Query('userType') userType?: string) {
        try {

            let validatedUserType: UserRole | undefined;

            if (userType) {
                if (userType === UserRole.NORMAL_USER || userType === UserRole.SELLER) {
                    validatedUserType = userType as UserRole;
                } else {
                    throw new BadRequestException('Invalid user type. Must be "normal_user" or "seller".');
                }
            }

            const token = await this.authService.validateOAuthLogin(req.user, 'google', userType);
            res.cookie('access_token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'none'
            });
            return res.redirect('/home');
        } catch (error) {
            if (error instanceof ConflictException) {
                return res.redirect('/error');
            }
            throw new InternalServerErrorException('An unexpected error occurred during Google authentication redirect.');
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @ApiCookieAuth()
    @ApiOperation({ summary: 'Log out current user' })
    @ApiResponse({ status: 200, description: 'Logout successful' })
    logout(@Res() res: Response) {
        try {
            res.clearCookie('access_token');
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message: 'Logout successful'
            });
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            throw new InternalServerErrorException('An unexpected error occurred during logout.');
        }
    }




    @Post('password/code/request')
    @Throttle({ default: { ttl: minutes(1440), limit: 6 } })
    @ApiOperation({ summary: 'Request password reset OTP' })
    @ApiBody({
        type: EmailDto,
        description: '[BODY] Email address for password reset',
        examples: {
            basic: {
                value: {
                    email: 'user@example.com'
                }
            }
        }
    })
    @ApiResponse({ status: 200, description: 'OTP sent successfully' })
    @ApiResponse({ status: 404, description: 'Email not found' })
    async requestPasswordReset(@Body() emailDto: EmailDto) {
        try {
            await this.authService.requestOtpCode(emailDto.email);
            return {
                statusCode: HttpStatus.OK,
                message: 'Password reset code requested successfully'
            };
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            throw new InternalServerErrorException('An unexpected error occurred during password reset code request.');
        }
    }



    @Post('password/code/validate')
    @Throttle({ default: { ttl: minutes(60), limit: 10 } })
    @ApiOperation({ summary: 'Validate password reset OTP' })
    @ApiBody({
        type: OtpDto,
        description: '[BODY] OTP validation data',
        examples: {
            basic: {
                value: {
                    email: 'user@example.com',
                    code: '123456'
                }
            }
        }
    })
    @ApiResponse({ status: 200, description: 'OTP validated successfully' })
    @ApiResponse({ status: 409, description: 'Invalid OTP code' })
    async validateOtp(@Body() validateOtpDto: OtpDto) {
        const isValid = await this.otpService.getOtpCode(
            validateOtpDto.email,
            validateOtpDto.code
        );
        if (!isValid) {
            throw new ConflictException('Invalid OTP code');
        }
        return {
            statusCode: HttpStatus.OK,
            message: 'OTP validated successfully'
        };
    } catch(error: any) {
        if (error instanceof ConflictException) {
            throw error;
        }
        throw new InternalServerErrorException('An unexpected error occurred during OTP validation.');
    }


    @UseGuards(JwtAuthGuard)
    @Post('password/reset')
    @Throttle({ default: { ttl: minutes(1440), limit: 4 } })
    @ApiOperation({ summary: 'Reset user password' })
    @ApiBody({
        type: ForgetPasswordDto,
        description: '[BODY] New password details',
        examples: {
            basic: {
                value: {
                    email: 'user@example.com',
                    password: 'NewSecurePass123!',
                    confirmPassword: 'NewSecurePass123!'
                }
            }
        }
    })
    @ApiResponse({ status: 200, description: 'Password updated successfully' })
    @ApiResponse({ status: 400, description: 'Passwords do not match' })
    async resetPassword(@Body() forgotPasswordDto: ForgetPasswordDto) {
        try {
            const { email, password } = forgotPasswordDto;
            await this.userService.updatePasswordUser(email, password);
            return {
                statusCode: HttpStatus.OK,
                message: 'Password updated successfully'
            };
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            throw new InternalServerErrorException('An unexpected error occurred during password update.');
        }
    }


    @Post('country')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Set user country' })
    @ApiBody({
        type: CountryDto,
        description: '[BODY] Country selection just [ syria , norway ] ',
        examples: {
            basic: {
                value: {
                    country: CountryEnum.SYRIA
                }
            }
        }
    })
    @ApiResponse({ status: 200, description: 'Country updated successfully' })
    async selectCountry(
        @UserDecorator('_id') userId: string,
        @Body() countryDto: CountryDto,
        @Res({ passthrough: true }) res: Response
    ) {
        return await this.authService.setCountry(userId, countryDto.country as CountryEnum, res)
    }
}




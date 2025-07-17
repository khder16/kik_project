import { Controller, Post, Body, Res, HttpStatus, UseGuards, Request, Req, InternalServerErrorException, Get, ConflictException, HttpException, Query, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto, UserRole } from './dto/signup.dto';
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





@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService, private readonly otpService: OtpService, private userService: UserService) { }

    @Post('signup')
    @Throttle({ default: { ttl: minutes(60), limit: 8 } })
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
    async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
        try {
            const result = await this.authService.login(loginDto, res);
            if (!result) {
                throw new NotFoundError('User Not Found')
            }
            return {
                statusCode: HttpStatus.OK,
                message: 'Login successful',
                user: {
                    email: result.user.email,
                    firstName: result.user.firstName,
                    lastName: result.user.lastName,
                    role: result.user.role
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
    async googleAuth(@Req() req) { }



    @Get('google/redirect')
    @UseGuards(AuthGuard('google'))
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
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });
            return res.redirect('/home');
        } catch (error) {
            if (error instanceof ConflictException) {
                return res.redirect('/error');
            }
            throw new InternalServerErrorException('An unexpected error occurred during Google authentication redirect.');
        }
    }


    @Post('logout')
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




    @Post('password/request-code')
    @Throttle({ default: { ttl: minutes(1440), limit: 6 } })
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



    @Post('password/validate-code')
    @Throttle({ default: { ttl: minutes(60), limit: 10 } })
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


    @Post('password/update-password')
    @Throttle({ default: { ttl: minutes(1440), limit: 4 } })
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

    @Get('currentuser')
    async getCurrentUserInfo(@Request() req: { user: User }) {
        console.log(req.user);

        return req.user;
    }
}





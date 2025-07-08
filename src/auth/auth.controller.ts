import { Controller, Post, Body, Res, HttpStatus, UseGuards, Req, InternalServerErrorException, Get, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { EmailDto } from './dto/email.dto';
import { OtpDto } from './dto/otp.dto';
import { OtpService } from 'src/otp/otp.service';
import { UserService } from 'src/user/user.service';
import { ForgetPasswordDto } from './dto/forget-password.dto';




@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService, private readonly otpService: OtpService, private userService: UserService) { }

    @Post('signup')
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
    @Throttle({ login: { limit: 5, ttl: 60 } })
    async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
        try {
            const result = await this.authService.login(loginDto, res);
            return {
                statusCode: HttpStatus.OK,
                message: 'Login successful',
                user: result.user
            };
        } catch (error) {
            if (error instanceof ConflictException) {
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
    async googleAuthRedirect(@Req() req, @Res() res: Response) {
        try {
            const token = await this.authService.validateOAuthLogin(req.user, 'google');
            res.cookie('access_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
            });
            return res.redirect('/home');
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
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
    @Throttle({ default: { limit: 3, ttl: 3600 } })
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
    @Throttle({ default: { limit: 5, ttl: 300 } })
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
    } catch(error) {
        if (error instanceof ConflictException) {
            throw error;
        }
        throw new InternalServerErrorException('An unexpected error occurred during OTP validation.');
    }


    @Post('password/update-password')
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
}





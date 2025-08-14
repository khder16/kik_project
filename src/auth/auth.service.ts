import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  Logger,
  HttpStatus,
  NotFoundException,
  HttpException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { CountryEnum, SignUpDto } from './dto/signup.dto';
import { Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { User, UserRole } from 'src/user/schemas/user.schema';
import { OtpService } from 'src/otp/otp.service';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { CreateAdminsDto } from 'src/admin/dto/create-admins.dto';

export interface JwtPayload {
  email: string;
  id: string;
  role: string;
  country: string;
}

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private configService: ConfigService,
    private jwtService: JwtService,
    private otpService: OtpService
  ) {}

  private readonly logger = new Logger(AuthService.name);

  async signUp(signUpDto: SignUpDto, res: Response) {
    const { email, phoneNumber, password } = signUpDto;
    if (email) {
      const userByEmail = await this.userService.findByEmail(email);
      if (userByEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    if (phoneNumber) {
      const userByPhone = await this.userService.findByPhoneNumber(phoneNumber);
      if (userByPhone) {
        throw new ConflictException('Phone number already exists');
      }
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await this.userService.create({
        ...signUpDto,
        password: hashedPassword,
        googleId: null,
        facebookId: null
      });

      const userInfo = {
        id: newUser._id,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        createdAt: newUser.createdAt
      };

      const payload = {
        id: newUser._id,
        email: newUser.email,
        phone: newUser.phoneNumber,
        role: newUser.role,
        country: newUser.country
      };
      const token = this.generateToken(payload);

      this.setTokenCookie(res, token);

      return { user: userInfo };
    } catch (error) {
      this.logger.error(
        `Error during user creation: ${error.message}`,
        error.stack
      );
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An unexpected error occurred during sign up.'
      );
    }
  }

  async login(loginDto: LoginDto, res: Response) {
    const { email, phoneNumber, password } = loginDto;

    if (!email && !phoneNumber) {
      throw new UnauthorizedException('Email or phone number is required');
    }

    try {
      let user: User;
      if (email) {
        user = await this.userService.findByEmail(email);
      } else if (phoneNumber) {
        user = await this.userService.findByPhoneNumber(phoneNumber);
      }

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const passwordValid = await bcrypt.compare(password, user.password);
      if (!passwordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const payload = {
        id: user._id,
        email: user.email,
        phone: user.phoneNumber,
        role: user.role,
        country: user.country
      };

      const userInfo = {
        id: user._id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        country: user.country,
        createdAt: user.createdAt
      };

      const token = this.generateToken(payload);

      this.setTokenCookie(res, token);

      return { user: userInfo };
    } catch (error) {
      this.logger.error(
        `Error during login process: ${error.message}`,
        error.stack
      );
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An unexpected error occurred during login.'
      );
    }
  }

  async validateOAuthLogin(
    profile: any,
    provider: 'google' | 'facebook',
    userType?: string
  ): Promise<string> {
    const email = profile.email || null;
    if (!email) {
      throw new BadRequestException(
        'Social profile did not provide an email address. Cannot create or link account.'
      );
    }

    try {
      let user = await this.userService.findByEmail(email);

      if (user) {
        if (provider === 'google' && !user.googleId) {
          user = await this.userService.update(user._id.toString(), {
            googleId: profile.id
          });
        } else if (provider === 'facebook' && !user.facebookId) {
          user = await this.userService.update(user._id.toString(), {
            facebookId: profile.id
          });
        }
      } else {
        const generatedPassword = await bcrypt.hash(
          Date.now().toString() + Math.random().toString(36).substring(2, 15),
          10
        );

        const userData = {
          email: email.toLowerCase(),
          password: generatedPassword,
          firstName: profile.firstName || null,
          lastName: profile.lastName || null,
          role: (userType as UserRole) || UserRole.NORMAL_USER,
          phoneNumper: ''
        };
        if (provider === 'google') {
          userData['googleId'] = profile.id;
        } else if (provider === 'facebook') {
          userData['facebookId'] = profile.id;
        }
        user = await this.userService.create(userData);
      }

      const payload = {
        email: user.email,
        id: user._id.toString(),
        role: user.role as UserRole
      };
      const token = this.generateToken(payload);
      return token;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An unexpected error occurred during social login.'
      );
    }
  }

  logout(res: Response) {
    res.cookie('access_token', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/'
    });
  }

  async requestOtpCode(email: string) {
    try {
      const code = this.generateVerificationCode().toString();

      const message = `Your OTP code is: ${code} the expiration time in 15 minutes`;
      const subject = `Email Verification`;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      if (await this.userService.findByEmail(email)) {
        await this.otpService.sendOtpEmail(email, message, subject);
        await this.otpService.createOtp(email, code, expiresAt);
      }
      return {
        message:
          'If an account exists with this email, you will receive an OTP shortly.',
        statusCode: HttpStatus.OK
      };
    } catch (error) {
      this.logger.error(
        `Error during password reset: ${error.message}`,
        error.stack
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to send OTP code');
    }
  }

  async verifyPasswordResetOtp(email: string, code: string): Promise<boolean> {
    return await this.otpService.getOtpCode(email, code);
  }

  async UpdatePassword(email: string, password: string) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await this.userService.updatePasswordUser(
        email,
        hashedPassword
      );
      return {
        message: 'Password Updated.',
        statusCode: HttpStatus.OK
      };
    } catch (error) {
      this.logger.error(
        `Error updating password for ${email}: ${error.message}`,
        error.stack
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to update password due to a server error.'
      );
    }
  }

  async signUpAdmin(createAdminDto: CreateAdminsDto) {
    const { email, phoneNumber, password } = createAdminDto;
    if (email) {
      const userByEmail = await this.userService.findByEmail(email);
      if (userByEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    if (phoneNumber) {
      const userByPhone = await this.userService.findByPhoneNumber(phoneNumber);
      if (userByPhone) {
        throw new ConflictException('Phone number already exists');
      }
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await this.userService.createAdmins({
        ...createAdminDto,
        password: hashedPassword,
        googleId: null,
        facebookId: null,
        role: 'admin'
      });

      const adminInfo = {
        id: newUser._id,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        createdAt: newUser.createdAt
      };

      return { admin: adminInfo };
    } catch (error) {
      this.logger.error(
        `Error during admin creation: ${error.message}`,
        error.stack
      );
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An unexpected error occurred during admin sign up.'
      );
    }
  }

  async setCountry(userId: string, country: CountryEnum, res: Response) {
    try {
      const user = await this.userService.findByIdAndUpdateCountry(
        userId,
        country
      );

      if (!user) {
        this.logger.warn(
          `Attempt to set country for non-existent user ID: ${userId}`
        );
        throw new NotFoundException('User not found');
      }

      const payload = {
        id: user._id,
        email: user.email,
        phone: user.phoneNumber,
        role: user.role,
        country: user.country
      };

      const token = this.generateToken(payload);
      this.setTokenCookie(res, token);

      return {
        access_token: token,
        user
      };
    } catch (error) {
      this.logger.error(
        `Error setting country for user ${userId}: ${error.message}`,
        error.stack
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to set country due to a server error.'
      );
    }
  }

  async changePassword(userId: string, newPasswordDto: ChangePasswordDto) {
    try {
      const user = await this.userService.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      if (newPasswordDto.newPassword !== newPasswordDto.confirmNewPassword) {
        throw new BadRequestException(
          'New password and confirm password do not match'
        );
      }
      const result = await this.userService.updatePasswordUser(
        userId,
        newPasswordDto.newPassword
      );
    } catch (error) {
      this.logger.error(
        `Error change password for user ${userId}: ${error.message}`,
        error.stack
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to change password due to a server error.'
      );
    }
  }

  private generateVerificationCode() {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return code;
  }

  private generateToken(payload: any) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN')
    });
  }

  private setTokenCookie(res: Response, token: string) {
    const cookieOptions = {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'none' as const,
      path: '/'
    };
    //  httpOnly: true,
    // secure: this.configService.get<string>('NODE_ENV') === 'production',
    // maxAge: 24 * 60 * 60 * 1000,
    // sameSite: 'strict' as const,
    // path: '/'
    res.cookie('access_token', token, cookieOptions);
  }
}

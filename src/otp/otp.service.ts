import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EmailDto } from 'src/auth/dto/email.dto';
import { Otp } from './schemas/otp.schema';
import { Model } from 'mongoose';
import { OtpDto } from './dto/otp.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class OtpService {
    constructor(@InjectModel(Otp.name) private otpModel: Model<Document>,
        private readonly mailService: MailerService,
        private configService: ConfigService,
    ) { }

    async createOtp(email: string, code: string, expiresAt: Date) {
        await this.otpModel.deleteMany({ email });
        const newOtp = new this.otpModel({
            email,
            code,
            expiresAt,
        });
        return newOtp.save();
    }


    async sendOtpEmail(email: string, message: string, subject: string) {
        try {
            this.mailService.sendMail({
                from: this.configService.get<string>('EMAIL_USER'),
                to: email,
                subject: subject,
                text: message,
                html: `<p>${message.replace(/\n/g, '<br>')}</p>`
            })
        } catch (error) {
            throw new InternalServerErrorException('Failed to send verification email.');
        }
    }

    async getOtpCode(email: string, code: string): Promise<boolean> {
        const otpCode = await this.otpModel.findOne({ email, code, expiresAt: { $gt: new Date() }, })
        if (!otpCode) {
            throw new UnauthorizedException('Invalid or expired OTP');
        }
        await this.otpModel.updateOne(
            { _id: otpCode._id },
            { $set: { used: true } }
        );
        return true
    }



}

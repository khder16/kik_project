import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './schemas/user.schema';
import { EmailDto } from 'src/auth/dto/email.dto';
import { JwtAuthGuard } from 'src/common/guards/authentication.guard';
import { minutes, Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';



@Controller('users')
    @UseGuards(JwtAuthGuard, AuthGuard('jwt'))
@Throttle({ default: { ttl: minutes(60), limit: 100 } })
export class UserController {

    constructor(private userService: UserService) { }

    @Get('user-email')
    @Throttle({ userController: {} })
    async getUserByEmail(@Body() emailDto: EmailDto): Promise<User> {
        try {
            const user = await this.userService.findByEmail(emailDto.email)
            return user;
        } catch (error) {
        }
    }

    @Get('all-users')
    async getAllUsers() {
        const users = await this.userService.findAll()
        return users;
    }

    @Post('ste-user-country')
    async setCountryToUser() {


    }
}
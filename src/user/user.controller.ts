import { Body, Controller, Get, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './schemas/user.schema';
import { EmailDto } from 'src/auth/dto/email.dto';
import { AuthGuard } from 'src/common/guards/authentication.guard';
import { Throttle } from '@nestjs/throttler';



@Controller('users')
export class UserController {

    constructor(private userService: UserService) { }

    @Get('email')
    @Throttle({ userController: {} })
        // @UseGuards(AuthGuard)
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
}

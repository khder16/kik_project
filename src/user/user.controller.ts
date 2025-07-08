import { Body, Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './schemas/user.schema';
import { EmailDto } from 'src/auth/dto/email.dto';




@Controller('users')
export class UserController {

    constructor(private userService: UserService) { }

    @Get('email')
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

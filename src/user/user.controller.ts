import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './schemas/user.schema';
import { JwtAuthGuard } from 'src/common/guards/authentication.guard';
import { minutes, Throttle } from '@nestjs/throttler';
import { UserDecorator } from 'src/common/decorators/userId.decorator';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';



@Controller('users')
@UseGuards(JwtAuthGuard)
@Throttle({ default: { ttl: minutes(60), limit: 100 } })
export class UserController {

    constructor(private userService: UserService) { }

    @Get('me')
    @ApiOperation({
        summary: 'Get current user profile',
        description: 'Retrieve profile information of the authenticated user'
    })
    @ApiResponse({
        status: 200,
        description: 'Returns user profile',
        type: User
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid or missing token'
    })
    async getUserProfile(@UserDecorator('_id') userId: string) {
        return await this.userService.findById(userId);
    }

}
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './schemas/user.schema';
import { JwtAuthGuard } from 'src/common/guards/authentication.guard';
import { minutes, Throttle } from '@nestjs/throttler';
import { UserDecorator } from 'src/common/decorators/userId.decorator';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UpdateUserDto, UpdateUserInformationDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
@Throttle({ default: { ttl: minutes(60), limit: 100 } })
export class UserController {
  constructor(private userService: UserService) {}

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

  @Patch(':id')
  @ApiOperation({
    summary: 'Update user information',
    description:
      'Update profile information of a specific user. Requires authentication and authorization.'
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: User
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid user ID format or validation error'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token'
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserInformationDto,
    @UserDecorator('_id') userId: string
  ): Promise<User> {
    if (id !== userId) {
      throw new ForbiddenException('You can only update your own profile');
    }

    try {
      return await this.userService.updateUserInfo(id, updateUserDto);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update user');
    }
  }
}

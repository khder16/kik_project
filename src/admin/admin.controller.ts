import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { EmailDto } from 'src/auth/dto/email.dto';
import { Roles } from 'src/common/decorators/rols.decorator';
import { UserDecorator } from 'src/common/decorators/userId.decorator';
import { JwtAuthGuard } from 'src/common/guards/authentication.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { GetStoresFilterDto } from 'src/store/dto/get-stores-by-country.dto';
import { StoreService } from 'src/store/store.service';
import { User, UserRole } from 'src/user/schemas/user.schema';
import { UserService } from 'src/user/user.service';
import { CreateAdminsDto } from './dto/create-admins.dto';
import { AuthService } from 'src/auth/auth.service';
import { getUsersByTypeQuery } from './dto/get-users-by-type.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(
    private userService: UserService,
    private storeService: StoreService,
    private authService: AuthService
  ) {}

  // ========================
  // Shared Admin and Super_Admin
  // ========================

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('profile')
  @ApiOperation({
    summary: 'Get admin profile',
    description:
      'Get profile information of the authenticated admin (Super Admin only)'
  })
  @ApiResponse({
    status: 200,
    description: 'Returns admin profile data'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not a super admin'
  })
  async getAdminProfile(@UserDecorator('_id') adminId: string) {
    return await this.userService.findById(adminId);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('stores')
  @ApiOperation({
    summary: 'Get stores by country',
    description:
      'Get paginated list of stores filtered by country (Super Admin only)'
  })
  @ApiQuery({
    name: 'country',
    description: '[QUERY] Country filter',
    type: String,
    required: false,
    example: 'norway'
  })
  @ApiQuery({
    name: 'page',
    description: '[QUERY] Page number (default: 1)',
    type: Number,
    required: false,
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    description: '[QUERY] Items per page (default: 10)',
    type: Number,
    required: false,
    example: 10
  })
  @ApiQuery({
    name: 'category',
    description: '[QUERY] Category filter',
    type: String,
    required: false,
    example: 'syria'
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of stores'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not a super admin'
  })
  async getAllStoresByCountry(
    @Query() getStoreByCountryQuery: GetStoresFilterDto
  ) {
    return await this.storeService.getAllStoresByFilters(
      getStoreByCountryQuery
    );
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete('stores/:storeId')
  @ApiOperation({
    summary: 'Delete store',
    description: 'Delete a store (Super Admin only)'
  })
  @ApiParam({
    name: 'storeId',
    description: '[PARAM] Store ID (MongoDB ObjectId)',
    type: String,
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({
    status: 200,
    description: 'Store deleted successfully'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not a super admin'
  })
  @ApiResponse({
    status: 404,
    description: 'Store not found'
  })
  async deleteStoreFromAdmin(
    @Param('storeId') storeId: string,
    @UserDecorator('_id') adminId: string
  ) {
    await this.storeService.deleteStore(storeId, undefined, true);
  }

  // ========================
  // Admin-Specific Actions (SuperAdmin only)
  // ========================

  @Roles(UserRole.SUPER_ADMIN)
  @Post('admins')
  @ApiOperation({
    summary: 'Create a new admin user',
    description: 'Creates a new admin user. Only accessible by Super Admins.'
  })
  @ApiBody({
    type: CreateAdminsDto,
    description: 'Admin user creation data',
    examples: {
      minimal: {
        summary: 'Minimal required fields',
        value: {
          email: 'admin@example.com',
          password: 'SecurePass123!',
          country: 'NORWAY'
        }
      },
      full: {
        summary: 'All possible fields',
        value: {
          email: 'admin@example.com',
          password: 'SecurePass123!',
          firstName: 'Admin',
          lastName: 'User',
          phoneNumber: '+1234567890',
          country: 'NORWAY'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Admin user successfully created',
    type: User
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or missing required fields'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only Super Admins can access'
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Email or phone number already exists'
  })
  async createAdmin(@Body() AdminsDto: CreateAdminsDto) {
    return await this.authService.signUpAdmin(AdminsDto);
  }

  // ========================
  // Users Management
  // ========================

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('email')
  @Throttle({ userController: {} })
  @ApiOperation({
    summary: 'Get user by email',
    description:
      'Retrieve user details by email address (Authenticated users only)'
  })
  @ApiBody({
    type: EmailDto,
    description: '[BODY] Email address to search for',
    examples: {
      example1: {
        value: { email: 'user@example.com' }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Returns user details',
    type: User
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  async getUserByEmail(@Body() emailDto: EmailDto): Promise<User> {
    try {
      const user = await this.userService.findByEmail(emailDto.email);
      return user;
    } catch (error) {
      throw error;
    }
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('users/filter')
  @ApiOperation({
    summary: 'Get all Users By Type',
    description: 'Get paginated list of all users (Super Admin only)'
  })
  @ApiQuery({
    name: 'role',
    description:
      '[QUERY] Type Users that you want like (normal_user , seller , admin)',
    required: true,
    example: UserRole.NORMAL_USER
  })
  @ApiQuery({
    name: 'page',
    description: '[QUERY] Page number (default: 1)',
    type: Number,
    required: false,
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    description: '[QUERY] Items per page (default: 20)',
    type: Number,
    required: false,
    example: 20
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of users'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not a super admin'
  })
  async filterUsersByType(@Query() query: getUsersByTypeQuery) {
    return await this.userService.findAllUsers(
      query.role,
      query.page,
      query.limit
    );
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete('users/:id')
  @ApiOperation({
    summary: 'Delete normal_user or seller by ID',
    description: 'Permanently delete a user account (Super Admin or Admin only)'
  })
  @ApiParam({
    name: 'id',
    description: '[PARAM] ID of the user to delete',
    required: true,
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully deleted',
    schema: {
      example: {
        success: true,
        message: 'User deleted successfully'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid user ID format'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not authorized to delete accounts'
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - User with specified ID not found'
  })
  async deleteUserById(
    @Param('id') userId: string,
    @UserDecorator() currentUser: User
  ) {
    const targetUser = await this.userService.findById(userId);
    if (
      currentUser.role === UserRole.ADMIN &&
      (targetUser.role === UserRole.ADMIN ||
        targetUser.role === UserRole.SUPER_ADMIN)
    ) {
      throw new ForbiddenException(
        'Admins can only delete normal users or sellers'
      );
    }
    return await this.userService.delete(userId);
  }
}

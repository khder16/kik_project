import { Body, Controller, Delete, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
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

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {

    constructor(private userService: UserService, private storeService: StoreService) { }

    @Roles(UserRole.SUPER_ADMIN)
    @Get('profile')
    @ApiOperation({
        summary: 'Get admin profile',
        description: 'Get profile information of the authenticated admin (Super Admin only)'
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




    @Roles(UserRole.SUPER_ADMIN)
    @Get('sellers')
    @ApiOperation({
        summary: 'Get all sellers',
        description: 'Get paginated list of all sellers (Super Admin only)'
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
        description: 'Returns paginated list of sellers'
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden - User is not a super admin'
    })
    async getAllSellers(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20
    ) {
        return await this.userService.findAllSellers(page, limit);
    }




    @Roles(UserRole.SUPER_ADMIN)
    @Get('users')
    @ApiOperation({
        summary: 'Get all users',
        description: 'Get paginated list of all users (Super Admin only)'
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
    async getAllUsers(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20
    ) {
        return await this.userService.findAllUsers(page, limit);
    }




    @Roles(UserRole.SUPER_ADMIN)
    @Get('stores')
    @ApiOperation({
        summary: 'Get stores by country',
        description: 'Get paginated list of stores filtered by country (Super Admin only)'
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



    @Roles(UserRole.SUPER_ADMIN)
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




    @Roles(UserRole.SUPER_ADMIN)
    @Get('email')
    @Throttle({ userController: {} })
    @ApiOperation({
        summary: 'Get user by email',
        description: 'Retrieve user details by email address (Authenticated users only)'
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
}

import { Controller, Delete, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from 'src/common/decorators/rols.decorator';
import { UserDecorator } from 'src/common/decorators/userId.decorator';
import { JwtAuthGuard } from 'src/common/guards/authentication.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { GetStoresByCountryDto } from 'src/store/dto/get-stores-by-country.dto';
import { StoreService } from 'src/store/store.service';
import { UserRole } from 'src/user/schemas/user.schema';
import { UserService } from 'src/user/user.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {

    constructor(private userService: UserService, private storeService: StoreService) { }

    @Roles(UserRole.SUPER_ADMIN)
    @Get('admin-profile')
    async getAdminProfile(@UserDecorator('_id') adminId: string) {
        return await this.userService.findById(adminId)
    }

    @Roles(UserRole.SUPER_ADMIN)
    @Get('all-sellers')
    async getAllSellers(@Query('page') page: number = 1,
        @Query('limit') limit: number = 20) {
        return await this.userService.findAllSellers(page, limit)
    }



    @Roles(UserRole.SUPER_ADMIN)
    @Get('all-users')
    async getAllUsers(@Query('page') page: number = 1,
        @Query('limit') limit: number = 20) {
        return await this.userService.findAllUsers(page, limit)
    }


    @Roles(UserRole.SUPER_ADMIN)
    @Get('all-stores')
    async getAllStoresByCountry(@Query() getStoreByCountryQuery: GetStoresByCountryDto) {
        return await this.storeService.getAllStoresByCountry(getStoreByCountryQuery, getStoreByCountryQuery.country)
    }


    @Roles(UserRole.SUPER_ADMIN)
    @Delete(':storeId/delete-store')
    async deleteStoreFromAdmin(@Param('storeId') storeId: string, @UserDecorator('_id') adminId: string) {
        await this.storeService.deleteStore(storeId, undefined, true);
    }

}

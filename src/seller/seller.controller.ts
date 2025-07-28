import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/authentication.guard';
import { SellerService } from './seller.service';
import { ProductService } from 'src/product/product.service';
import { StoreService } from 'src/store/store.service';
import { UserDecorator } from 'src/common/decorators/userId.decorator';
import { UserService } from 'src/user/user.service';

@Controller('seller')
@UseGuards(JwtAuthGuard)
export class SellerController {
    constructor(private sellerService: SellerService, private userService: UserService, private productService: ProductService, private storeService: StoreService) { }


    @Get('seller-profile')
    async getSellerProfile(@UserDecorator('_id') sellerId: string) {
        return await this.userService.findSellerById(sellerId)
    }

    @Get('seller-store')
    async getSellerStore(@UserDecorator('_id') sellerId: string) {
        return await this.storeService.getStoresByOwnerId(sellerId)
    }


    @Get('seller-products')
    async getAllSellerProducts(@UserDecorator('_id') sellerId: string, @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,) {
        const store = await this.storeService.getStoresBySellerId(sellerId)
        console.log(store);
        
        // return await this.productService.getProductsByStoreId(., page, limit)
    }
}

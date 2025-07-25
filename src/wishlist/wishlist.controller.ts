import { Body, Controller, Request, Post, Get, UseGuards, Param, Delete, Query } from '@nestjs/common';
import { UserDecorator } from 'src/common/decorators/userId.decorator';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/addToWishlist.dto';
import { JwtAuthGuard } from 'src/common/guards/authentication.guard';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {

    constructor(private wishlistService: WishlistService) { }




    @Post(':productId')
    async addProductToWishlist(@Param('productId') productId: string, @UserDecorator('_id') userId: string) {
        return await this.wishlistService.addToWishlist(productId, userId)
    }

    @Get('get-wishlist')
    async getUserWishlistList(@UserDecorator('_id') userId: string, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return await this.wishlistService.getUserWishlist(userId, page, limit)
    }



    @Delete(':productId')
    async removeProductsFromWishlist(@Param('productId') productId: string, @UserDecorator('_id') userId: string) {
        return await this.wishlistService.removeFromWishlist(productId, userId)
    }
}

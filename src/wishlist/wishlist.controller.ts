import { Body, Controller, Request, Post, Get, UseGuards, Param, Delete, Query } from '@nestjs/common';
import { UserDecorator } from 'src/common/decorators/userId.decorator';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/addToWishlist.dto';
import { JwtAuthGuard } from 'src/common/guards/authentication.guard';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {

    constructor(private wishlistService: WishlistService) { }





    @Post(':productId')
    @ApiOperation({
        summary: 'Toggle product in wishlist',
        description: 'Add or remove a product from user wishlist'
    })
    @ApiParam({
        name: 'productId',
        description: '[PARAM] Product ID (MongoDB ObjectId)',
        type: String,
        example: '507f1f77bcf86cd799439011'
    })
    @ApiResponse({
        status: 200,
        description: 'Returns updated wishlist status'
    })
    @ApiResponse({
        status: 404,
        description: 'Product not found'
    })
    async toggleWishlist(
        @Param('productId') productId: string,
        @UserDecorator('_id') userId: string
    ) {
        return this.wishlistService.toggleWishlist(productId, userId);
    }

    // @Post(':productId')
    // async addProductToWishlist(@Param('productId') productId: string, @UserDecorator('_id') userId: string) {
    //     return await this.wishlistService.addToWishlist(productId, userId)
    // }

    @Get('')
    @ApiOperation({
        summary: 'Get user wishlist',
        description: 'Get paginated list of products in user wishlist'
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
    @ApiResponse({
        status: 200,
        description: 'Returns paginated wishlist items'
    })
    async getUserWishlistList(@UserDecorator('_id') userId: string, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return await this.wishlistService.getUserWishlist(userId, page, limit)
    }



    @Delete(':productId')
    @ApiOperation({
        summary: 'Remove product from wishlist',
        description: 'Remove a specific product from user wishlist'
    })
    @ApiParam({
        name: 'productId',
        description: '[PARAM] Product ID (MongoDB ObjectId)',
        type: String,
        example: '507f1f77bcf86cd799439011'
    })
    @ApiResponse({
        status: 200,
        description: 'Product removed from wishlist'
    })
    @ApiResponse({
        status: 404,
        description: 'Product not found in wishlist'
    })
    async removeProductsFromWishlist(@Param('productId') productId: string, @UserDecorator('_id') userId: string) {
        return await this.wishlistService.removeFromWishlist(productId, userId)
    }
}

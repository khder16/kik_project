import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/authentication.guard';
import { CartService } from './cart.service';
import { UserDecorator } from 'src/common/decorators/userId.decorator';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart.dto';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {

    constructor(private cartService: CartService) { }

    @Post('add-to-cart')
    async addToCart(@UserDecorator('_id') userId: string, @Body() addToCartDto: AddToCartDto) {
        return await this.cartService.addToCart(userId.toString(), addToCartDto.productId, addToCartDto.quantity)
    }

    @Get('get-cart-info')
    async getUserCart(@UserDecorator('_id') userId: string, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return await this.cartService.getUserCart(userId.toString(), page, limit)
    }

    @Delete('item/:productId')
    async removeFromCart(@UserDecorator('_id') userId: string, @Param('productId') productId: string) {
        return this.cartService.removeFromCart(userId.toString(), productId)
    }

    @Patch('item/:productId')
    async updateCartItem(@UserDecorator('_id') userId: string, @Param('productId') productId: string, @Body() updateItemDto: UpdateCartItemDto) {
        return this.cartService.updateCartItem(userId.toString(), productId, updateItemDto.quantity)
    }

}

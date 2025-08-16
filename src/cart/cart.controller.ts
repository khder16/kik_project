import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/authentication.guard';
import { CartService } from './cart.service';
import { UserDecorator } from 'src/common/decorators/userId.decorator';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart.dto';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse
} from '@nestjs/swagger';

export interface userInfoDataType {
  _id: string;
  email: string;
  role: string;
  country: string;
}
@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private cartService: CartService) {}

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiBody({
    type: AddToCartDto,
    description: '[BODY] Product ID and quantity to add',
    examples: {
      example1: {
        value: {
          productId: '507f1f77bcf86cd799439011',
          quantity: 2
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Item added to cart' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async addToCart(
    @UserDecorator() userInfo: userInfoDataType,
    @Body() addToCartDto: AddToCartDto
  ) {
    return await this.cartService.addToCart(
      userInfo,
      addToCartDto.productId,
      addToCartDto.quantity
    );
  }

  @Get('my-cart')
  @ApiOperation({ summary: 'Get user cart' })
  @ApiQuery({
    name: 'page',
    description: '[QUERY] Page number (default: 1)',
    required: false,
    type: Number
  })
  @ApiQuery({
    name: 'limit',
    description: '[QUERY] Items per page (default: 10)',
    required: false,
    type: Number
  })
  @ApiResponse({
    status: 200,
    description: 'Returns cart items with pagination'
  })
  async getUserCart(
    @UserDecorator('_id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    return await this.cartService.getUserCart(userId, page, limit);
  }

  @Delete('items/:productId')
  @ApiParam({
    name: 'productId',
    description: '[PARAM] MongoDB ID of the product to remove',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiBody({
    type: UpdateCartItemDto,
    description: '[BODY] New quantity for the item',
    examples: {
      example1: {
        value: { quantity: 3 }
      }
    }
  })
  @ApiQuery({
    name: 'limit',
    description: '[QUERY] Items per page (default: 10)',
    required: false,
    type: Number
  })
  @ApiResponse({ status: 200, description: 'Item removed from cart' })
  @ApiResponse({ status: 404, description: 'Item not found in cart' })
  async removeFromCart(
    @UserDecorator('_id') userId: string,
    @Param('productId') productId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    return this.cartService.removeFromCart(userId, productId, page, limit);
  }

  @Patch('items/:productId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiParam({
    name: 'productId',
    description: '[PARAM] MongoDB ID of the product to update',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiBody({
    type: UpdateCartItemDto,
    description: '[BODY] New quantity for the item',
    examples: {
      example1: {
        value: { quantity: 3 }
      }
    }
  })
  @ApiQuery({
    name: 'page',
    description: '[QUERY] page (default: 1)',
    required: false,
    type: Number
  })
  @ApiQuery({
    name: 'limit',
    description: '[QUERY] Items per page (default: 10)',
    required: false,
    type: Number
  })
  @ApiResponse({
    status: 200,
    description: 'Returns cart items with pagination'
  })
  @ApiResponse({ status: 200, description: 'Quantity updated' })
  @ApiResponse({ status: 400, description: 'Invalid quantity' })
  @ApiResponse({ status: 404, description: 'Item not found in cart' })
  async updateCartItem(
    @UserDecorator('_id') userId: string,
    @Param('productId') productId: string,
    @Body() updateItemDto: UpdateCartItemDto,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    return this.cartService.updateCartItem(
      userId,
      productId,
      updateItemDto.quantity,
      page,
      limit
    );
  }
}

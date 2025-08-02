import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { ReviewsService } from 'src/reviews/reviews.service';
import { JwtAuthGuard } from 'src/common/guards/authentication.guard';
import { CreateReviewDto } from 'src/reviews/dto/create-review.dto';
import { UserDecorator } from 'src/common/decorators/userId.decorator';
import { CountryEnum } from 'src/auth/dto/signup.dto';
import { SearchDto } from './dto/search.dto';
import { ProductFilterDto } from './dto/filter-serch-query.dto';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
    @UseGuards(JwtAuthGuard)
export class ProductController {
    constructor(
        private productService: ProductService,
        private reviewService: ReviewsService
    ) { }

    @Get('search')
    @ApiOperation({
        summary: 'Search products',
        description: 'Search products by keyword with pagination'
    })
    @ApiQuery({
        name: 'search',
        description: '[QUERY] Search term (minimum 2 characters)',
        type: String,
        required: false,
        example: 'laptop'
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
        description: 'Returns paginated search results'
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid search parameters'
    })
    async searchProduct(
        @Query() query: SearchDto,
        @UserDecorator('country') userCountry: CountryEnum
    ) {
        return await this.productService.searchProducts(query, userCountry);
    }

    @Get('newArrival')
    @ApiOperation({
        summary: 'Get new arrivals',
        description: 'Get recently added products'
    })
    @ApiResponse({
        status: 200,
        description: 'Returns list of new arrival products'
    })
    async getNewProducts(@UserDecorator('country') userCountry: string) {
        return await this.productService.findNewArrivals(userCountry);
    }



    @Get('')
    @ApiOperation({
        summary: 'Filter products',
        description: 'Filter products by category, price range with pagination'
    })
    @ApiQuery({
        name: 'category',
        description: '[QUERY] Product category filter',
        type: String,
        required: false,
        example: 'electronics'
    })
    @ApiQuery({
        name: 'minPrice',
        description: '[QUERY] Minimum price (inclusive)',
        type: Number,
        required: false,
        example: 100
    })
    @ApiQuery({
        name: 'maxPrice',
        description: '[QUERY] Maximum price (inclusive)',
        type: Number,
        required: false,
        example: 1000
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
        description: 'Returns filtered products with pagination'
    })
    async filterProducts(
        @Query() filterDto: ProductFilterDto,
        @UserDecorator('country') userCountry: string
    ) {
        return await this.productService.filteredProducts(filterDto, userCountry);
    }




    @Get(':productId')
    @ApiOperation({
        summary: 'Get product details',
        description: 'Get detailed information about a specific product'
    })
    @ApiParam({
        name: 'productId',
        description: '[PARAM] Product ID (MongoDB ObjectId)',
        type: String,
        example: '507f1f77bcf86cd799439011'
    })
    @ApiResponse({
        status: 200,
        description: 'Returns product details'
    })
    @ApiResponse({
        status: 404,
        description: 'Product not found'
    })
    async findProductById(
        @Param('productId') productId: string,
        @UserDecorator('country') userCountry: CountryEnum
    ) {
        return await this.productService.getProductById(productId.toString(), userCountry);
    }





    @Post(':productId/reviews')
    @ApiOperation({
        summary: 'Add product review',
        description: 'Create a new review for the specified product'
    })
    @ApiParam({
        name: 'productId',
        description: '[PARAM] Product ID (MongoDB ObjectId)',
        type: String,
        example: '507f1f77bcf86cd799439011'
    })
    @ApiBody({
        type: CreateReviewDto,
        description: '[BODY] Review content and rating',
        examples: {
            basic: {
                value: {
                    rating: 5,
                    comment: 'Excellent product!'
                }
            }
        }
    })
    @ApiResponse({
        status: 201,
        description: 'Review created successfully'
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid review data'
    })
    @ApiResponse({
        status: 404,
        description: 'Product not found'
    })
    async addReview(
        @Body() reviewDto: CreateReviewDto,
        @Param('productId') productId: string,
        @UserDecorator('_id') userId: string
    ) {
        return await this.reviewService.createReview(reviewDto, productId, userId);
    }




    @Get(':productId/reviews')
    @ApiOperation({
        summary: 'Get product reviews',
        description: 'Get paginated reviews for a specific product'
    })
    @ApiParam({
        name: 'productId',
        description: '[PARAM] Product ID (MongoDB ObjectId)',
        type: String,
        example: '507f1f77bcf86cd799439011'
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
        description: 'Returns paginated reviews'
    })
    @ApiResponse({
        status: 404,
        description: 'Product not found'
    })
    async getReviewsForProduct(
        @Param('productId') productId: string,
        @Query('page') page: number,
        @Query('limit') limit: number
    ) {
        return await this.reviewService.getAllReviewsForProduct(productId, page, limit);
    }

    @Delete(':productId/reviews/:reviewId')
    @ApiOperation({
        summary: 'Delete review',
        description: 'Delete a specific review (only by owner or admin)'
    })
    @ApiParam({
        name: 'productId',
        description: '[PARAM] Product ID (MongoDB ObjectId)',
        type: String,
        example: '507f1f77bcf86cd799439011'
    })
    @ApiParam({
        name: 'reviewId',
        description: '[PARAM] Review ID (MongoDB ObjectId)',
        type: String,
        example: '507f1f77bcf86cd799439012'
    })
    @ApiResponse({
        status: 200,
        description: 'Review deleted successfully'
    })
    @ApiResponse({
        status: 403,
        description: 'Not authorized to delete this review'
    })
    @ApiResponse({
        status: 404,
        description: 'Review not found'
    })
    async deleteReview(
        @Param('reviewId') reviewId: string,
        @Param('productId') productId: string,
        @UserDecorator('_id') userId: string
    ) {
        return await this.reviewService.deleteReview(reviewId, productId, userId);
    }
}
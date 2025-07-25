import { Body, Controller, Delete, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { ImageProcessingService } from './image-process.service';
import { JwtAuthGuard } from 'src/common/guards/authentication.guard';
import { CreateReviewDto } from 'src/reviews/dto/create-review.dto';
import { ReviewsService } from 'src/reviews/reviews.service';
import { UserDecorator } from 'src/common/decorators/userId.decorator';
import { CountryEnum } from 'src/auth/dto/signup.dto';
import { User } from 'src/user/schemas/user.schema';


@Controller('products')
    @UseGuards(JwtAuthGuard)
export class ProductController {

    constructor(private productService: ProductService, private reviewService: ReviewsService, private imagesService: ImageProcessingService) { }



    @Get('get-product/:productId')
    async findProductById(@Param('productId') productId: string, @UserDecorator('country') userCountry: CountryEnum) {
        return await this.productService.getProductById(productId.toString(), userCountry)
    }

    @Get('search')
    async searchProduct(@Query('search') search: string, @UserDecorator('country') userCountry: CountryEnum) {
        return await this.productService.searchProducts(search, userCountry)
    }

    @Get('get-all-products')
    async filterProducts(
        @Query('category') category: string,
        @Query('min-price') minPrice: number,
        @Query('max-price') maxPrice: number,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
        @UserDecorator('country') userCountry: string
    ) {
        return await this.productService.filteredProducts(category, minPrice, maxPrice, page, limit, userCountry)
    }



    @Post(':productId/add-review')
    async addReview(@Body() reviewDto: CreateReviewDto,
        @Param('productId') productId: string,
        @UserDecorator('_id') userId: string) {
        return await this.reviewService.createReview(reviewDto, productId, userId)
    }


    @Get(':productId/get-all-reviews')
    async getReviewsForProduct(@Param('productId') productId: string, @Query('page') page: number,
        @Query('limit') limit: number) {
        return await this.reviewService.getAllReviews(productId, page, limit)
    }


    @Delete(':productId/:reviewId/delete-review')
    async deleteReview(@Param('reviewId') reviewId: string,
        @Param('productId') productId: string,
        @UserDecorator('_id') userId: string) {
        return await this.reviewService.deleteReview(reviewId, productId, userId)
    }

    @Get('new-products')
    async getNewProducts(@UserDecorator('country') userCountry: string) {
        return await this.productService.findNewArrivals(userCountry)
    }
}


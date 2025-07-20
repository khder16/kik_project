import { BadRequestException, Request, Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, UploadedFile, UseInterceptors, UseGuards } from '@nestjs/common';
import { ProductDto } from './dto/product.dto';
import { ProductService } from './product.service';
import { ImageProcessingService } from './image-process.service';
import { User } from 'src/user/schemas/user.schema';
import { JwtAuthGuard } from 'src/common/guards/authentication.guard';
import { CreateReviewDto } from 'src/reviews/dto/create-review.dto';
import { ReviewsService } from 'src/reviews/reviews.service';


@Controller('products')
    @UseGuards(JwtAuthGuard)
export class ProductController {

    constructor(private productService: ProductService, private reviewService: ReviewsService, private imagesService: ImageProcessingService) { }



    @Get('get-product/:id')
    async findProductById(@Param('id') id: string, @Request() req: { user: User }) {
        return await this.productService.getProductById(id, req.user.country)
    }

    // @Get('search')
    // async searchProduct(@Query('search') search: string, @Query('lang') lang: 'no' | 'ar') {
    //     return await this.productService.searchProducts(search, lang)
    // }

    @Get('get-all-products')
    async filterProducts(
        @Query('category') category: string,
        @Query('min-price') minPrice: number,
        @Query('max-price') maxPrice: number,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
        @Request() req: { user: User }) {
        return await this.productService.filteredProducts(category, minPrice, maxPrice, page, limit, req.user.country)
    }


    @Post(':productId/add-review')
    async addReview(@Body() reviewDto: CreateReviewDto,
        @Param('productId') productId: string,
        @Request() req: { user: User }) {
        return await this.reviewService.createReview(reviewDto, productId, req.user._id.toString())
    }


    @Get(':productId/get-all-reviews')
    async getReviewsForProduct(@Param('productId') productId: string, @Query('page') page: number,
        @Query('limit') limit: number, @Request() req: { user: User }) {
        return await this.reviewService.getAllReviews(productId, page, limit)
    }


    @Delete(':productId/:reviewId/delete-review')
    async deleteReview(@Param('reviewId') reviewId: string,
        @Param('productId') productId: string,
        @Request() req: { user: User }) {
        return await this.reviewService.deleteReview(reviewId, productId, req.user._id.toString())
    }

}


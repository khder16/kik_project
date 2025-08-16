import { BadRequestException, Body, ConflictException, Controller, Delete, ForbiddenException, Get, Inject, NotFoundException, Param, Patch, PayloadTooLargeException, Post, Query, Request, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { User } from 'src/user/schemas/user.schema';
import { JwtAuthGuard } from 'src/common/guards/authentication.guard';
import { UpdateStoreDto } from './dto/updateStore.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { imageStoreOptions } from 'src/config/multer-images-Upload';
import { ImageProcessingService } from 'src/product/image-process.service';
import { ProductService } from 'src/product/product.service';
import { AddNewProductDto } from 'src/product/dto/add-new-product.dto';
import { unlink } from 'fs/promises';
import { UpdateProductDto } from './dto/update-product.dto';
import { minutes, Throttle } from '@nestjs/throttler';
import { UserService } from 'src/user/user.service';
import { UserDecorator } from '../common/decorators/userId.decorator'
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager'
import { GetStoresFilterDto } from './dto/get-stores-by-country.dto';
import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from 'src/common/guards/optionalAuthentication.guard';
import { CategoryEnum } from 'src/common/enum/category.enum';

@Controller('stores')
export class StoreController {

    constructor(private userService: UserService, private storeService: StoreService, private imagesService: ImageProcessingService, private productService: ProductService, @Inject(CACHE_MANAGER) private cacheManager: Cache) { }


    @UseGuards(JwtAuthGuard)
    @Post('create')
    @Throttle({ default: { ttl: minutes(60), limit: 8 } })
    @UseInterceptors(FileInterceptor('image', imageStoreOptions))
    @ApiOperation({
        summary: 'Create a new store',
        description: 'Create a new store (only for sellers)'
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: '[BODY] Store data with optional image',
        type: CreateStoreDto
    })
    @ApiResponse({
        status: 201,
        description: 'Store created successfully'
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden - Only sellers can create stores'
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid store data'
    })
    async createStore(@Body() storeDto: CreateStoreDto, @UserDecorator() user: { _id: string, role: string }, @UploadedFile() image?: Express.Multer.File) {
        if (user.role !== 'seller') {
            throw new ForbiddenException('Only sellers can create stores');
        }
        const ownerId = user._id

        await this.validateStoreLimit(ownerId);

        let imagePath: string | undefined;
        if (image) {
            imagePath = await this.imagesService.processAndSaveSingleImage(image);
        }

        const newStore = await this.storeService.createStore(storeDto, ownerId, imagePath);
        // 2. Initiate Stripe connection
        // const stripeLink = await this.stripeService.connectStripeAccount(newStore._id, user._id);
        return {
            newStore,
            // stripeOnboardingUrl: stripeLink.url
        };
    }





    @UseGuards(OptionalJwtAuthGuard)
    @Get('/all')
    async getAllStore(@Query() allStoresFiltersDto: GetStoresFilterDto) {
        return this.storeService.getAllStoresByFilters(allStoresFiltersDto)
    }



    @UseGuards(OptionalJwtAuthGuard)
    @Get(':storeId/products')
    @ApiOperation({
        summary: 'Get store products',
        description: 'Get paginated list of products in a store'
    })
    @ApiParam({
        name: 'storeId',
        description: '[PARAM] Store ID (MongoDB ObjectId)',
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
        description: 'Returns paginated products'
    })
    @ApiResponse({
        status: 404,
        description: 'Store not found'
    })
    async getAllProductsByStore(@Param('storeId') storeId: string, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return await this.productService.getProductsByStoreId(storeId, page, limit)
    }




    @UseGuards(OptionalJwtAuthGuard)
    @Get(':storeId/products/:productId')
    @ApiOperation({
        summary: 'Get product details',
        description: 'Get detailed information about a product'
    })
    @ApiParam({
        name: 'storeId',
        description: '[PARAM] Store ID (MongoDB ObjectId)',
        type: String,
        example: '507f1f77bcf86cd799439011'
    })
    @ApiParam({
        name: 'productId',
        description: '[PARAM] Product ID (MongoDB ObjectId)',
        type: String,
        example: '507f1f77bcf86cd799439012'
    })
    @ApiResponse({
        status: 200,
        description: 'Returns product details'
    })
    @ApiResponse({
        status: 404,
        description: 'Product not found'
    })
    async getOneProduct(@Param('productId') productId: string) {
        return await this.productService.getProductById(productId)
    }



    async deleteFile(file: Express.Multer.File) {
        try {
            await unlink(file.path);
        } catch (err) {
            console.warn(`Error deleting file ${file.path}:`, err.message);
        }
    }



    // Helper methods for better organization
    private validateUserIsSeller(role: string): void {
        if (role !== 'seller' && role !== 'super_admin') {
            throw new ForbiddenException('Only sellers can create stores');
        }
    }

    private async validateUserOwnsStore(storeId: string, ownerId: string): Promise<void> {
        const storeExists = await this.storeService.getStoreById(storeId);
        if (storeExists.owner._id.toString() !== ownerId) {
            throw new ForbiddenException('Only owner can add products');
        }
    }

    private validateRequiredFields(storeId: string, images: Express.Multer.File[]): void {
        if (!storeId) throw new BadRequestException('Store ID is required.');
        if (!images?.length) throw new BadRequestException('At least one product image is required.');
    }

    private validateStoreLimit = async (ownerId: string) => {
        const stores = await this.storeService.getStoresByOwnerId(ownerId)
        if (stores.length >= 1) {
            throw new ConflictException('User cannot have more than 1 store.');
        }
    }
}
import { BadRequestException, Body, ConflictException, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Patch, PayloadTooLargeException, Post, Query, Request, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { User } from 'src/user/schemas/user.schema';
import { JwtAuthGuard } from 'src/common/guards/authentication.guard';
import { UpdateStoreDto } from './dto/updateStore.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { imageStoreOptions } from 'src/config/multer-images-Upload';
import { ImageProcessingService } from 'src/product/image-process.service';
import { ProductService } from 'src/product/product.service';
import { ProductDto } from 'src/product/dto/product.dto';
import { unlink } from 'fs/promises';
import { UpdateProductDto } from './dto/update-product.dto';
import { minutes, Throttle } from '@nestjs/throttler';
import { UserService } from 'src/user/user.service';
import { UserDecorator } from '.././common/decorators/userId.decorator'


@Controller('stores')
@UseGuards(JwtAuthGuard)
export class StoreController {

    constructor(private userService: UserService, private storeService: StoreService, private imagesService: ImageProcessingService, private productService: ProductService) { }


    @Post('create-store')
    @Throttle({ default: { ttl: minutes(60), limit: 8 } })
    @UseInterceptors(FileInterceptor('image', imageStoreOptions))
    async createStore(@Body() storeDto: CreateStoreDto, @UserDecorator() user: { _id: string, role: string }, @UploadedFile() image?: Express.Multer.File) {
        if (user.role !== 'seller') {
            throw new ForbiddenException('Only sellers can create stores');
        }
        const ownerId = user._id

        // await this.validateStoreLimit(ownerId);

        let imagePath: string | undefined;
        if (image) {
            imagePath = await this.imagesService.processAndSaveSingleImage(image);
        }

        const newStore = await this.storeService.createStore(storeDto, ownerId, imagePath);
        return newStore;
    }



    @Patch(':storeId/update-store')
    @Throttle({ default: { ttl: minutes(60), limit: 8 } })
    @UseInterceptors(FileInterceptor('image', imageStoreOptions))
    async updateStore(@Param('storeId') storeId: string, @Body() updateStoreDto: UpdateStoreDto, @UserDecorator() user: { _id: string, role: string }, @UploadedFile() image?: Express.Multer.File) {

        if (user.role !== 'seller') {
            throw new ForbiddenException('Only sellers can create stores');
        }
        const ownerId = user._id

        let imagePath: string | undefined;
        if (image) {
            imagePath = await this.imagesService.processAndSaveSingleImage(image);
        }
        return this.storeService.updateStore(storeId, updateStoreDto, ownerId, imagePath)
    }


    @Delete(':storeId/delete-sotre')
    async deleteStore(@Param('storeId') storeId: string, @UserDecorator() user: { _id: string, role: string }) {

        // 1. Authorization checks
        this.validateUserIsSeller(user.role);
        await this.validateUserOwnsStore(storeId, user._id);
        const isSuperAdmin = user.role === 'super_admin';
        const ownerId = user._id
        return this.storeService.deleteStore(storeId, ownerId, isSuperAdmin)
    }

    @Get('/get-all-stores')
    async getAllStore(@Query('page') page: number = 1, @Query('limit') limit: number = 10
    ) {
        return this.storeService.getAllStores(page, limit)
    }

    @Post(':storeId/add-product')
    @UseInterceptors(FilesInterceptor('images', 4, imageStoreOptions))
    async addNewProduct(
        @Param('storeId') storeId: string,
        @UploadedFiles() images: Express.Multer.File[],
        @Body() newProductDto: ProductDto,
        @UserDecorator() user: { _id: string, role: string }
    ) {

        // 1. Authorization checks
        this.validateUserIsSeller(user.role);
        await this.validateUserOwnsStore(storeId, user._id.toString());

        // 2. Input validation
        this.validateRequiredFields(storeId, images);

        try {
            // 3. Business logic
            const storeExists = await this.storeService.getStoreById(storeId);
            if (!storeExists) throw new NotFoundException('Store not found.');

            const imagePaths = await this.imagesService.processAndSaveImages(images, storeId);
            const productData = { ...newProductDto, images: imagePaths, store: storeId };

            return await this.productService.createProduct(productData);
        } catch (error) {
            images?.forEach(file => this.deleteFile(file));
            if (error?.code === 'LIMIT_FILE_SIZE') {
                throw new PayloadTooLargeException('File too large (max 5MB)');
            }
            throw new BadRequestException(error?.message || 'Failed to add product');
        }
    }



    @UseInterceptors(FilesInterceptor('images', 4, imageStoreOptions))
    @Patch(':storeId/update-product/:id')
    async updateProduct(
        @Param('id') id: string,
        @Param('storeId') storeId: string,
        @Body() updateProductDto: UpdateProductDto,
        @UploadedFiles() images: Express.Multer.File[],
        @UserDecorator() user: { _id: string, role: string }
    ) {
        // 1. Authorization checks
        this.validateUserIsSeller(user.role);
        await this.validateUserOwnsStore(storeId, user._id);

        // 2. Input validation
        this.validateRequiredFields(storeId, images);
        try {
            const storeExists = await this.storeService.getStoreById(storeId);
            if (!storeExists) throw new NotFoundException('Store not found.');
            const imagePaths = await this.imagesService.processAndSaveImages(images, storeId);
            return await this.productService.updateProduct(updateProductDto, imagePaths, id);
        } catch (error) {
            throw new BadRequestException(error?.message || 'Failed to update product');
        }
    }

    @Delete(':storeId/delete-product/:id')
    async deleteProduct(
        @Param('id') id: string,
        @Param('storeId') storeId: string,
        @UserDecorator() user: { _id: string, role: string }
    ) {
        // 1. Authorization checks
        this.validateUserIsSeller(user.role);
        await this.validateUserOwnsStore(storeId, user._id);
        try {
            return await this.productService.deleteProduct(id)
        } catch (error) {
            throw new BadRequestException(error?.message || 'Failed to Delete product');
        }
    }



    @Get(':storeId/get-all-products')
    async getAllProductsByStore(@UserDecorator('country') userCountry: string, @Param('storeId') storeId: string, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return await this.productService.getProductsByStoreId(storeId, page, limit, userCountry)
    }


    @Get(':storeId/get-product/:productId')
    async getOneProduct(@Param('productId') productId: string, @UserDecorator('country') userCountry: string) {
        return await this.productService.getProductById(productId, userCountry)
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

    // private validateStoreLimit = async (ownerId: string) => {
    //     const stores = await this.storeService.getStoresByOwnerId(ownerId)
    //     if (stores.length >= 1) {
    //         throw new ConflictException('User cannot have more than 1 store.');
    //     }
    // }
}
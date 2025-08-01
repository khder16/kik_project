import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Patch, PayloadTooLargeException, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/authentication.guard';
import { SellerService } from './seller.service';
import { ProductService } from 'src/product/product.service';
import { StoreService } from 'src/store/store.service';
import { UserDecorator } from 'src/common/decorators/userId.decorator';
import { UserService } from 'src/user/user.service';
import { UpdateStoreDto } from 'src/store/dto/updateStore.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/rols.decorator';
import { UserRole } from 'src/user/schemas/user.schema';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductDto } from 'src/product/dto/product.dto';
import { imageStoreOptions } from 'src/config/multer-images-Upload';
import { unlink } from 'fs/promises';
import { ImageProcessingService } from 'src/product/image-process.service';




@Controller('seller')
    @UseGuards(JwtAuthGuard, RolesGuard)
export class SellerController {
    constructor(private sellerService: SellerService, private imagesService: ImageProcessingService, private userService: UserService, private productService: ProductService, private storeService: StoreService) { }

    @Roles(UserRole.SELLER)
    @Get('seller-profile')
    async getSellerProfile(@UserDecorator('_id') sellerId: string) {
        return await this.userService.findSellerById(sellerId)
    }

    @Roles(UserRole.SELLER)
    @Get('seller-store')
    async getSellerStore(@UserDecorator('_id') sellerId: string) {
        return await this.storeService.getStoresByOwnerId(sellerId)
    }

    @Roles(UserRole.SELLER)
    @Get('seller-products')
    async getAllSellerProducts(@UserDecorator('_id') sellerId: string, @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,) {

        const store = await this.storeService.getStoresBySellerId(sellerId)

        return await this.productService.getProductsByStoreId(store._id.toString(), page, limit)
    }

    @Roles(UserRole.SELLER)
    @Patch('update-store/:storeId')
    async updateSellerStore(@UserDecorator('_id') sellerId: string, @Param('storeId') storeId: string, @Body() updateStoreData: UpdateStoreDto) {
        return await this.storeService.updateStore(storeId, updateStoreData, sellerId)
    }

    @Roles(UserRole.SELLER)
    @Delete('delete-store/:storeId')
    async deleteSellerStore(@UserDecorator('_id') sellerId: string, @Param('storeId') storeId: string, @Body() updateStoreData: UpdateStoreDto) {
        return await this.storeService.deleteStore(storeId, sellerId)
    }



    @Roles(UserRole.SELLER)
    @Post('/stores/:storeId/products')
    @UseInterceptors(FilesInterceptor('images', 4, imageStoreOptions))
    async addNewProduct(
        @Param('storeId') storeId: string,
        @UploadedFiles() images: Express.Multer.File[],
        @Body() newProductDto: ProductDto,
        @UserDecorator() user: { _id: string, role: string }
    ) {

        this.validateUserOwnsStore(storeId, user._id.toString());

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
    validateRequiredFields(storeId: string, images: Express.Multer.File[]) {
        throw new Error('Method not implemented.');
    }
    validateUserOwnsStore(storeId: string, arg1: string) {
        throw new Error('Method not implemented.');
    }
    validateUserIsSeller(role: string) {
        throw new Error('Method not implemented.');
    }

    async deleteFile(file: Express.Multer.File) {
        try {
            await unlink(file.path);
        } catch (err) {
            console.warn(`Error deleting file ${file.path}:`, err.message);
        }
    }
}

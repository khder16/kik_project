import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Patch, PayloadTooLargeException, Post, Query, Request, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { User } from 'src/user/schemas/user.schema';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from 'src/common/guards/authentication.guard';
import { UpdateStoreDto } from './dto/updateStore.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { imageStoreOptions } from 'src/config/multer-images-Upload';
import { ImageProcessingService } from 'src/product/image-process.service';
import { ProductService } from 'src/product/product.service';
import * as fs from 'fs';
import { ProductDto } from 'src/product/dto/product.dto';
import { unlink } from 'fs/promises';
import { UpdateProductDto } from './dto/update-product.dto';
import path from 'path';



@Controller('stores')
@UseGuards(JwtAuthGuard)
export class StoreController {

    constructor(private storeService: StoreService, private imagesService: ImageProcessingService, private productService: ProductService) { }


    @Post('create-store')
    async createStore(@Body() storeDto: CreateStoreDto, @Request() req: { user: User }) {
        if (req.user.role !== 'seller') {
            throw new ForbiddenException('Only sellers can create stores');
        }
        const ownerId = req.user._id.toString()
        return this.storeService.createStore(storeDto, ownerId);
    }



    @Patch(':storeId/update-sotre')
    async updateStore(@Param('storeId') storeId: string, @Body() updateStoreDto: UpdateStoreDto, @Request() req: { user: User }) {
        if (req.user.role !== 'seller') {
            throw new ForbiddenException('Only sellers can create stores');
        }
        const ownerId = req.user._id.toString()
        return this.storeService.updateStore(storeId, updateStoreDto, ownerId)
    }


    @Delete(':storeId/delete-sotre')
    async deleteStore(@Param('storeId') storeId: string, @Request() req: { user: User }) {

        if (req.user.role !== 'seller' && req.user.role !== 'super_admin') {
            throw new ForbiddenException('Only sellers or super admins can delete stores');
        }
        const isSuperAdmin = req.user.role === 'super_admin';
        const ownerId = req.user._id.toString()
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
        @Request() req: { user: User }
    ) {

        // 1. Authorization checks
        this.validateUserIsSeller(req.user);
        this.validateUserOwnsStore(storeId, req.user._id.toString());

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
        @Request() req: { user: User }
    ) {
        // 1. Authorization checks
        this.validateUserIsSeller(req.user);
        await this.validateUserOwnsStore(storeId, req.user._id.toString());

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
        @Request() req: { user: User }
    ) {
        // 1. Authorization checks
        this.validateUserIsSeller(req.user);
        await this.validateUserOwnsStore(storeId, req.user._id.toString());
        try {
            return await this.productService.deleteProduct(id)
        } catch (error) {
            throw new BadRequestException(error?.message || 'Failed to Delete product');
        }
    }



    @Get(':storeId/get-all-products')
    async getAllProductsByStore(@Param('storeId') storeId: string, @Query('page') page: number = 1, @Query('limit') limit: number = 20) {
        return await this.productService.getProductsByStoreId(storeId, page, limit)
    }


    @Get(':storeId/get-product/:productId')
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
    private validateUserIsSeller(user: User): void {
        if (user.role !== 'seller' && user.role !== 'super_admin') {
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
}
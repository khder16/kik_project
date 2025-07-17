import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ProductDto } from './dto/product.dto';
import { ProductService } from './product.service';
import { imageStoreOptions } from 'src/config/multer-images-Upload';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageProcessingService } from './image-process.service';
import * as fs from 'fs';

@Controller('products')
export class ProductController {

    constructor(private productService: ProductService, private imagesService: ImageProcessingService) { }



    @Get('get-product/:id')
    findProductById(@Param('id') id: string) {
    }



    @Get('getall-products')
    async filterProducts(
        @Query('category') category: string,
        @Query('min-price') minPrice: number,
        @Query('max-price') maxPrice: number,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20) {
        return await this.productService.filteredProducts(category, minPrice, maxPrice, page, limit)
    }




}


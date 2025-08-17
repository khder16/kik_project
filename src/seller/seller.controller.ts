import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpException,
  Inject,
  NotFoundException,
  Param,
  Patch,
  PayloadTooLargeException,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
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
import { AddNewProductDto } from 'src/product/dto/add-new-product.dto';
import { imageStoreOptions } from 'src/config/multer-images-Upload';
import { unlink } from 'fs/promises';
import { ImageProcessingService } from 'src/product/image-process.service';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse
} from '@nestjs/swagger';
import { UpdateProductDto } from 'src/store/dto/update-product.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Controller('seller')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SellerController {
  constructor(
    private sellerService: SellerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private imagesService: ImageProcessingService,
    private userService: UserService,
    private productService: ProductService,
    private storeService: StoreService
  ) {}

  @Roles(UserRole.SELLER)
  @Get('profile')
  @ApiOperation({
    summary: 'Get seller profile',
    description: 'Get profile information of the authenticated seller'
  })
  @ApiResponse({
    status: 200,
    description: 'Returns seller profile data'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not a seller'
  })
  async getSellerProfile(@UserDecorator('_id') sellerId: string) {
    return await this.userService.findSellerById(sellerId);
  }

  @Roles(UserRole.SELLER)
  @Get('stores')
  @ApiOperation({
    summary: 'Get seller stores',
    description: 'Get all stores owned by the authenticated seller'
  })
  @ApiResponse({
    status: 200,
    description: 'Returns list of seller stores'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not a seller'
  })
  async getSellerStore(@UserDecorator('_id') sellerId: string) {
    return await this.storeService.getStoresByOwnerId(sellerId);
  }

  @Roles(UserRole.SELLER)
  @Get('products')
  @ApiOperation({
    summary: 'Get seller products',
    description: 'Get paginated list of products from all seller stores'
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
    status: 403,
    description: 'Forbidden - User is not a seller'
  })
  async getAllSellerProducts(
    @UserDecorator('_id') sellerId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    const store = await this.storeService.getStoresBySellerId(sellerId);
    return await this.productService.getProductsByStoreId(
      store._id,
      page,
      limit,
      sellerId
    );
  }

  @Roles(UserRole.SELLER)
  @ApiOperation({
    summary: 'Update seller store',
    description: 'Update store information (only for store owner)'
  })
  @ApiParam({
    name: 'storeId',
    description: '[PARAM] Store ID (MongoDB ObjectId)',
    type: String,
    example: '507f1f77bcf86cd799439011'
  })
  @ApiBody({
    type: UpdateStoreDto,
    description: '[BODY] Store update data'
  })
  @ApiResponse({
    status: 200,
    description: 'Store updated successfully'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not store owner'
  })
  @ApiResponse({
    status: 404,
    description: 'Store not found'
  })
  @Patch('stores/:storeId')
  async updateSellerStore(
    @UserDecorator('_id') sellerId: string,
    @Param('storeId') storeId: string,
    @Body() updateStoreData: UpdateStoreDto
  ) {
    return await this.storeService.updateStore(
      storeId,
      updateStoreData,
      sellerId
    );
  }

  @Roles(UserRole.SELLER)
  @Delete('stores/:storeId')
  @ApiOperation({
    summary: 'Delete seller store',
    description: 'Delete a store (only for store owner)'
  })
  @ApiParam({
    name: 'storeId',
    description: '[PARAM] Store ID (MongoDB ObjectId)',
    type: String,
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({
    status: 200,
    description: 'Store deleted successfully'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not store owner'
  })
  @ApiResponse({
    status: 404,
    description: 'Store not found'
  })
  async deleteSellerStore(
    @UserDecorator('_id') sellerId: string,
    @Param('storeId') storeId: string,
    @Body() updateStoreData: UpdateStoreDto
  ) {
    return await this.storeService.deleteStore(storeId, sellerId);
  }

  @Roles(UserRole.SELLER)
  @Post('/stores/:storeId/products')
  @UseInterceptors(FilesInterceptor('images', 4, imageStoreOptions))
  @ApiOperation({
    summary: 'Add new product',
    description: 'Create a new product in seller store (max 4 images)'
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'storeId',
    description: '[PARAM] Store ID (MongoDB ObjectId)',
    type: String,
    example: '507f1f77bcf86cd799439011'
  })
  @ApiBody({
    description: '[BODY] Product data with images',
    type: AddNewProductDto
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully'
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid product data'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not store owner'
  })
  @ApiResponse({
    status: 404,
    description: 'Store not found'
  })
  @ApiResponse({
    status: 413,
    description: 'Payload too large - Image size exceeds limit'
  })
  async addNewProduct(
    @Param('storeId') storeId: string,
    @UploadedFiles() images: Express.Multer.File[],
    @Body() newProductDto: AddNewProductDto,
    @UserDecorator() user: { _id: string; role: string }
  ) {
    // 2. Input validation
    this.validateRequiredFields(storeId, images);
    await this.validateUserOwnsStore(storeId, user._id.toString());

    try {
      // 3. Business logic
      const storeExists = await this.storeService.getStoreById(storeId);
      if (!storeExists) throw new NotFoundException('Store not found.');
      //   if(storeExists.category !== newProductDto.category) {
      //     throw BadRequestException('product category must be ')
      //   }
      const imagePaths = await this.imagesService.processAndSaveImages(
        images,
        storeId
      );
      const productData = {
        ...newProductDto,
        images: imagePaths,
        store: storeId,
        country: storeExists.country
      };
      return await this.productService.createProduct(productData);
    } catch (error) {
      images?.forEach((file) => this.deleteFile(file));
      if (error?.code === 'LIMIT_FILE_SIZE') {
        throw new PayloadTooLargeException('File too large (max 5MB)');
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException('Failed to add product');
    }
  }

  async deleteFile(file: Express.Multer.File) {
    try {
      await unlink(file.path);
    } catch (err) {
      console.warn(`Error deleting file ${file.path}:`, err.message);
    }
  }

  @Roles(UserRole.SELLER)
  @Get('stores/:storeId/products/:productId')
  @ApiOperation({
    summary: 'Get product details',
    description:
      'Get detailed information about a specific product in a store (Seller only)'
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
    description: 'Returns detailed product information'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not a seller'
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found'
  })
  async getOneProduct(@Param('productId') productId: string) {
    return await this.productService.getProductById(productId);
  }

  @Roles(UserRole.SELLER)
  @UseInterceptors(FilesInterceptor('images', 4, imageStoreOptions))
  @Patch('stores/:storeId/products/:productId')
  @ApiOperation({
    summary: 'Update product',
    description: 'Update product information (max 4 images)'
  })
  @ApiConsumes('multipart/form-data')
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
  @ApiBody({
    description: '[BODY] Product update data with optional images',
    type: UpdateProductDto
  })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully'
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid product data'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not store owner'
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found'
  })
  async updateProduct(
    @Param('productId') productId: string,
    @Param('storeId') storeId: string,
    @Body() updateProductDto: UpdateProductDto,
    @UserDecorator() user: { _id: string; role: string },
    @UploadedFiles() images?: Express.Multer.File[],
  ) {
    // 1. Authorization checks
    this.validateUserIsSeller(user.role);
    await this.validateUserOwnsStore(storeId, user._id);

    try {
      const storeExists = await this.storeService.getStoreById(storeId);
      if (!storeExists) throw new NotFoundException('Store not found.');

      let imagePaths: string[] | undefined;

      if (images && images.length > 0) {
        imagePaths = await this.imagesService.processAndSaveImages(
          images,
          storeId
        );
        updateProductDto.images = imagePaths
      }

      return await this.productService.updateProduct(
        updateProductDto,
        productId,
      );
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Failed to update product'
      );
    }
  }


  
  @Roles(UserRole.SELLER)
  @Delete('stores/:storeId/products/:productId')
  @ApiOperation({
    summary: 'Delete product',
    description: 'Delete product from store'
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
    description: 'Product deleted successfully'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not store owner'
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found'
  })
  async deleteProduct(
    @Param('productId') productId: string,
    @Param('storeId') storeId: string,
    @UserDecorator() user: { _id: string; role: string }
  ) {
    // 1. Authorization checks
    this.validateUserIsSeller(user.role);
    await this.validateUserOwnsStore(storeId, user._id);
    try {
      return await this.productService.deleteProduct(productId);
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Failed to Delete product'
      );
    }
  }

  // Helper methods for better organization
  private validateUserIsSeller(role: string): void {
    if (role !== 'seller' && role !== 'super_admin') {
      throw new ForbiddenException('Only sellers can create stores');
    }
  }

  private async validateUserOwnsStore(
    storeId: string,
    ownerId: string
  ): Promise<void> {
    const storeExists = await this.storeService.getStoreById(storeId);
    if (storeExists.owner._id.toString() !== ownerId) {
      throw new ForbiddenException('Only owner can add products');
    }
  }

  private validateRequiredFields(
    storeId: string,
    images?: Express.Multer.File[]
  ): void {
    if (!storeId) throw new BadRequestException('Store ID is required.');
    if (!images?.length)
      throw new BadRequestException('At least one product image is required.');
  }

  private validateRequiredFieldsForUpdate(storeId: string): void {
    if (!storeId) throw new BadRequestException('Store ID is required.');
  }

  private validateStoreLimit = async (ownerId: string) => {
    const stores = await this.storeService.getStoresByOwnerId(ownerId);
    if (stores.length >= 1) {
      throw new ConflictException('User cannot have more than 1 store.');
    }
  };
}

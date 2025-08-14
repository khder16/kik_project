import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AddNewProductDto } from './dto/add-new-product.dto';
import { unlink, access } from 'fs/promises';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UpdateProductDto } from 'src/store/dto/update-product.dto';
import { ProductFilterandSearchDto } from './dto/filter-serch-query.dto';
import { CACHE_TTLS } from 'src/common/constant/cache.constants';
import { SimpleStore } from 'src/common/interfaces/storeData.interface';
import { WishlistCommonService } from 'src/wishlist/wishlist-common.service';
import { Product } from 'src/product/schemas/product.schema';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly wishlistService: WishlistCommonService
  ) {}

  private readonly logger = new Logger(ProductService.name);

  async createProduct(newProduct: AddNewProductDto): Promise<Product> {
    try {
      const product = new this.productModel(newProduct);
      return await product.save();
    } catch (error) {
      this.logger.error(
        `Error creating product: ${error.message}`,
        error.stack
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to create product due to an unexpected server error.'
      );
    }
  }

  async updateProduct(
    newProduct: UpdateProductDto,
    images: string[],
    productId: string
  ): Promise<Product> {
    const session = await this.productModel.startSession();
    session.startTransaction();
    try {
      // 1. Find existing product
      const existingProduct = await this.productModel
        .findById(productId)
        .session(session);
      if (!existingProduct) {
        throw new NotFoundException('Product not found.');
      }

      // 2. Delete old images if they exist
      if (existingProduct.images && existingProduct.images.length > 0) {
        await this.deleteProductImages(
          existingProduct.images,
          existingProduct.store.toString()
        );
      }

      // 3. Update product with new data
      const updatedProduct = await this.productModel.findByIdAndUpdate(
        productId,
        { ...newProduct, images },
        { new: true, session }
      );

      await session.commitTransaction();
      return updatedProduct;
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(
        `Error updating product: ${error.message}`,
        error.stack
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update product due to an unexpected server error.'
      );
    } finally {
      session.endSession();
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    const session = await this.productModel.startSession();
    session.startTransaction();
    try {
      // 1. Find existing product
      const productToDelete = await this.productModel
        .findById(id)
        .session(session);
      if (!productToDelete) {
        throw new NotFoundException('Product not found.');
      }

      // 2. Delete associated images if they exist
      if (productToDelete.images && productToDelete.images.length > 0) {
        await this.deleteProductImages(
          productToDelete.images,
          productToDelete.store.toString()
        );
      }

      // 3. Delete the product document
      await this.productModel.findByIdAndDelete(id).session(session);

      await session.commitTransaction();
      return true;
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(
        `Error deleting product: ${error.message}`,
        error.stack
      );

      if (error instanceof HttpException) throw error;
      if (error.name === 'MongoNetworkError') {
        throw new ServiceUnavailableException('Database unavailable');
      }

      throw new InternalServerErrorException(
        'Failed to delete product due to an unexpected server error.'
      );
    } finally {
      session.endSession();
    }
  }

  async getProductsByStoreId(storeId: any, page: number, limit: number) {
    try {
      const skip = (page - 1) * limit;
      if (limit > 50) throw new BadRequestException('Maximum limit is 50');
      const cacheKey = `products:${storeId}:page${page}:limit${limit}`;
      const cached = await this.cacheManager.get<{
        products: Product[];
        total: number;
      }>(cacheKey);

      if (cached) return cached;

      const [products, totalCount] = await Promise.all([
        this.productModel
          .find({ store: storeId })
          .select(
            '_id country name_en name_ar name_no description_no description_ar description_en price category stockQuantity images store createdAt'
          )
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.productModel.countDocuments({ store: storeId })
      ]);

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      const result = {
        data: products,
        meta: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: totalCount,
          totalPages,
          hasNextPage,
          hasPreviousPage
        }
      };

      // Caching the result
      await this.cacheManager.set(cacheKey, result, CACHE_TTLS.PRODUCTS);

      return result;
    } catch (error) {
      this.logger.error(`Error get products: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to get products due to an unexpected server error.'
      );
    }
  }



  async filteredProducts(
    filterQueryDto: ProductFilterandSearchDto,
    userId: string
  ) {
    try {
      const { country, category, minPrice, maxPrice, page, limit } =
        filterQueryDto;
      const cacheKey = `products:${country}:${category}:${minPrice}:${maxPrice}:${page}:${limit}`;
      const cacheCountKey = `products_count:${country}:${category}:${minPrice}:${maxPrice}`;
      const cached = await this.cacheManager.get<{
        data: Product[];
        meta: any;
      }>(cacheKey);

      if (!userId) {
       
      }
      if (limit > 50) throw new BadRequestException('Maximum limit is 50');

      if (cached) {
        return cached;
      }

      const skip = (page - 1) * limit;

      const query: any = {};

      if (category) {
        query.category = category;
      }

      if (country) {
        query.country = country;
      }

      if (minPrice !== undefined && minPrice !== null && !isNaN(minPrice)) {
        query.price = { ...query.price, $gte: minPrice };
      }
      if (maxPrice !== undefined && maxPrice !== null && !isNaN(maxPrice)) {
        query.price = { ...query.price, $lte: maxPrice };
      }
      const [products, totalCount,wishlistProductIds] = await Promise.all([
        this.productModel
          .find(query)
          .populate({
            path: 'store',
            select: '_id owner name country'
          })
          .select(
            '_id country name_en name_ar name_no description_no description_ar description_en price category stockQuantity images store createdAt'
          )
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .lean()
          .exec(),
        this.productModel.countDocuments(query),
        this.wishlistService.getWishlistItemsByUserId(userId)
      ]);

      
      const productsWithWishlistStatus = products.map((product) => ({
        ...product,
        isLiked: wishlistProductIds.has(product._id.toString())
      }));

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      const response = {
        data: productsWithWishlistStatus || [],
        meta: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: totalCount,
          totalPages,
          hasNextPage,
          hasPreviousPage
        }
      };

      await Promise.all([
        this.cacheManager.set(cacheKey, response, CACHE_TTLS.PRODUCTS),
        this.cacheManager.set(cacheCountKey, totalCount, CACHE_TTLS.PRODUCTS)
      ]);

      return response;
    } catch (error) {
      this.logger.error(
        `Error get filtered products: ${error.message}`,
        error.stack
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to get filtered products due to an unexpected server error.'
      );
    }
  }

  async getProductById(productId: string): Promise<any> {
    try {
      const cacheKey = `product:${productId}`;

      // Try to get from cache
      const cached = await this.cacheManager.get<Product>(cacheKey);

      if (cached) {
        return cached;
      }

      const product = await this.productModel
        .findById(productId)
        .populate<{
          store: {
            _id: any;
            name: string;
            facebook?: string;
            instagram?: string;
            whatsApp?: string;
            email: string;
            country: string;
          };
        }>({
          path: 'store',
          select: '_id name facebook instagram whatsApp email country'
        })
        .select(
          '_id country name_en name_ar name_no description_no description_ar description_en price category stockQuantity images store createdAt'
        )
        .lean()
        .exec();

      if (!product || !product.store) {
        throw new NotFoundException(
          'Product not found or not available in your country'
        );
      }

      if (product.store as SimpleStore) {
        product.store.facebook = product.store.facebook || null;
        product.store.instagram = product.store.instagram || null;
        product.store.whatsApp = product.store.whatsApp || null;
      }

      await this.cacheManager.set(cacheKey, product, CACHE_TTLS.PRODUCTS);

      return product;
    } catch (error) {
      this.logger.error(`Error get products: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to get products due to an unexpected server error.'
      );
    }
  }

  async findOneById(id: string): Promise<Product> {
    try {
      return await this.productModel
        .findById(id)
        .select(
          '_id name_en name_ar name_no description_no description_ar description_en price category stockQuantity images store createdAt'
        )
        .lean()
        .exec();
    } catch (error) {
      this.logger.error(`Error get products: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to get products due to an unexpected server error.'
      );
    }
  }

  private async deleteProductImages(
    imagePaths: string[],
    storeId: string
  ): Promise<void> {
    const deletePromises = imagePaths.map(async (imagePath) => {
      try {
        access(imagePath);
        await unlink(imagePath);
        this.logger.log(`Deleted old product image: ${imagePath}`);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          // Ignore "file not found" errors
          this.logger.warn(
            `Failed to delete image ${imagePath}: ${err.message}`
          );
        }
      }
    });
    await Promise.all(deletePromises);
  }

  async searchProducts(querySearch: ProductFilterandSearchDto) {
    try {
      const { search, country, category, minPrice, maxPrice, page, limit } =
        querySearch;

      const skip = (page - 1) * limit;
      if (limit > 50) throw new BadRequestException('Maximum limit is 50');

      // 2. Decode and sanitize
      const decodedSearch = decodeURIComponent(search.trim());
      // Prevent regex injection
      const sanitizedSearch = this.escapeRegex(decodedSearch);
      const cacheKey = `search:${search || 'no-search'}:${country || 'all'}:${category || 'all'}:${minPrice || '0'}:${maxPrice || 'inf'}:${page}:${limit}`;
      const cached = await this.cacheManager.get(cacheKey);

      if (cached) {
        return cached;
      }

      const query: any = {};

      if (search && search.trim().length >= 2) {
        const sanitizedSearch = this.escapeRegex(
          decodeURIComponent(search.trim())
        );
        query.$or = [
          { name_ar: { $regex: sanitizedSearch, $options: 'i' } },
          { name_en: { $regex: sanitizedSearch, $options: 'i' } },
          { name_no: { $regex: sanitizedSearch, $options: 'i' } },
          { description_ar: { $regex: sanitizedSearch, $options: 'i' } },
          { description_en: { $regex: sanitizedSearch, $options: 'i' } },
          { description_no: { $regex: sanitizedSearch, $options: 'i' } }
        ];
      } else if (search && search.trim().length < 2) {
        throw new BadRequestException(
          'Search term must be at least 2 characters'
        );
      }

      if (country) query.country = country;
      if (category) query.category = category;
      if (minPrice !== undefined)
        query.price = { ...query.price, $gte: minPrice };
      if (maxPrice !== undefined)
        query.price = { ...query.price, $lte: maxPrice };

      const collationSettings = {
        syria: { locale: 'ar', strength: 2 },
        norway: { locale: 'nb', strength: 2 }
      };

      const [products, totalCount] = await Promise.all([
        this.productModel
          .find(query)
          .populate({
            path: 'store',
            select: '_id name country'
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.productModel.countDocuments(query)
      ]);

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      const response = {
        data: products,
        meta: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: totalCount,
          totalPages,
          hasNextPage,
          hasPreviousPage,
          searchTerm: sanitizedSearch || null
        }
      };
      await this.cacheManager.set(cacheKey, response, CACHE_TTLS.PRODUCTS);

      return response;
    } catch (error) {
      this.logger.error(`Product search failed: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Search operation failed');
    }
  }

  private escapeRegex(text: string): string {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  }

  async findNewArrivals() {
    const cacheKey = `new-arrivals`;

    try {
      // 1. Try to get from cache first
      const cached = await this.cacheManager.get<{
        newCarsProducts: Product[];
        newPlanetsProducts: Product[];
        newBuildingProducts: Product[];
        newOtherProducts: Product[];
      }>(cacheKey);
      if (cached) {
        return cached;
      }

      const createQuery = (category: string) => {
        const query: any = { category };
        return query;
      };

      // 2. Database queries with country filtering
      const [cars, planets, buildings, other] = await Promise.all([
        this.productModel
          .find(createQuery('cars'))
          .populate({
            path: 'store',
            select: '_id owner name country'
          })
          .sort({ createdAt: -1 })
          .limit(4)
          .lean()
          .exec(),

        this.productModel
          .find(createQuery('planets'))
          .populate({
            path: 'store',
            select: '_id owner name country'
          })
          .sort({ createdAt: -1 })
          .limit(4)
          .lean()
          .exec(),

        this.productModel
          .find(createQuery('buildings'))
          .populate({
            path: 'store',
            select: '_id owner name country'
          })
          .sort({ createdAt: -1 })
          .limit(4)
          .lean()
          .exec(),
        this.productModel
          .find(createQuery('other'))
          .populate({
            path: 'store',
            select: '_id owner name country'
          })
          .sort({ createdAt: -1 })
          .limit(4)
          .lean()
          .exec()
      ]);
      // 3. Prepare response
      const result = {
        newCarsProducts: cars,
        newPlanetsProducts: planets,
        newBuildingProducts: buildings,
        newOtherProducts: other
      };

      // 4. Cache the result
      await this.cacheManager.set(cacheKey, result, CACHE_TTLS.PRODUCTS);
      return result;
    } catch (error) {
      this.logger.error(
        `Error getting new arrivals: ${error.message}`,
        error.stack
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get new arrivals');
    }
  }

  // const aggregationPipeline = [
  //     {
  //         $lookup: {
  //             from: 'stores',
  //             localField: 'store',
  //             foreignField: '_id',
  //             as: 'store'
  //         }
  //     },
  //     { $unwind: '$store' },
  //     { $match: { 'store.country': userCountry } },
  //     { $sort: { createdAt: -1 } },
  //     { $limit: 4 }
  // ];

  // const[cars, planets, buildings] = await Promise.all([
  //     this.productModel.aggregate([...aggregationPipeline, { $match: { category: 'cars' } }]),
  //     this.productModel.aggregate([...aggregationPipeline, { $match: { category: 'planets' } }]),
  //     this.productModel.aggregate([...aggregationPipeline, { $match: { category: 'buildings' } }])
  // ]);
}

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
    newProductData: UpdateProductDto,
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

      // if (newProduct.images && newProduct.images.length > 0) {
      //   // Delete old images if they exist
      //   if (existingProduct.images && existingProduct.images.length > 0) {
      //     await this.deleteProductImages(
      //       existingProduct.images,
      //       existingProduct.store.toString()
      //     );
      //   }
      // }

      // const updateData = images ? { ...newProduct, images } : { ...newProduct };

      const updatedProduct = await this.productModel.findByIdAndUpdate(
        productId,
        newProductData,
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

  async getAllProductsBySellerId(
    sellerId: string,
    page: number,
    limit: number,
    storeIds?: string[]
  ) {
    try {
      const skip = (page - 1) * limit;
      if (limit > 50) throw new BadRequestException('Maximum limit is 50');

      // 1. Build the query

        if(!storeIds) {
          throw new NotFoundException("there is no products in your store/s ")
        }
      const wishlistProductIds = sellerId
        ? await this.wishlistService.getWishlistItemsByUserId(sellerId)
        : [];
      const query = { store: { $in: storeIds } };
      const [products, totalCount] = await Promise.all([
        this.productModel
          .find(query)
        .select(
            '_id country name_en name_ar name_no description_no description_ar description_en price category stockQuantity images store createdAt'
          )
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.productModel.countDocuments(query)
      ]);

      // 4. Add wishlist status and pagination meta
      const productsWithStatus = this.addWishlistStatus(
        products,
        wishlistProductIds
      );

      return {
        data: { products: productsWithStatus },
        meta: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      this.logger.error(
        `Error fetching products: ${error.message}`,
        error.stack
      );
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException('Failed to fetch products');
    }
  }

  async getProductsByStoreId(
    storeId: string,
    page: number,
    limit: number,
    sellerId?: string
  ) {
    try {
      const skip = (page - 1) * limit;
      if (limit > 50) throw new BadRequestException('Maximum limit is 50');

      // Get wishlist IDs (empty array if no user)
      const wishlistProductIds = sellerId
        ? await this.wishlistService.getWishlistItemsByUserId(sellerId)
        : [];

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

      const productsWithStatus = this.addWishlistStatus(
        products,
        wishlistProductIds
      );

      const response = {
        data: {
          productsWithStatus
        },
        meta: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: totalCount,
          totalPages,
          hasNextPage,
          hasPreviousPage
        }
      };
      return response;
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
    userId?: string
  ) {
    try {
      const { country, category, minPrice, maxPrice, page, limit } =
        filterQueryDto;
      const cacheKey = `products:${country}:${category}:${minPrice}:${maxPrice}:${page}:${limit}`;

      // Validation
      if (limit > 50) throw new BadRequestException('Maximum limit is 50');

      // Get wishlist IDs (empty array if no user)
      const wishlistProductIds = userId
        ? await this.wishlistService.getWishlistItemsByUserId(userId)
        : [];

      // 3. Try Cache
      const cached = await this.cacheManager.get<{
        products: Product[];
        totalCount: number;
      }>(cacheKey);

      let products = [];
      let totalCount: number = 0;

      if (cached) {
        products = cached.products;
        totalCount = cached.totalCount;
      } else {
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

        [products, totalCount] = await Promise.all([
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
          this.productModel.countDocuments(query)
        ]);
        await this.cacheManager.set(
          cacheKey,
          { products, totalCount },
          CACHE_TTLS.PRODUCTS
        );
      }

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      const productsWithStatus = this.addWishlistStatus(
        products,
        wishlistProductIds
      );

      const response = {
        data: {
          productsWithStatus
        },
        meta: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: totalCount,
          totalPages,
          hasNextPage,
          hasPreviousPage
        }
      };

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

  async getProductById(productId: string, userId?: string): Promise<any> {
    try {
      const cacheKey = `product:${productId}`;
      const cachedProduct = await this.cacheManager.get<Product>(cacheKey);
      let product = cachedProduct;

      // 2. Fetch from DB if not cached
      if (!product) {
        product = await this.productModel
          .findById(productId)
          .populate({
            path: 'store',
            select: '_id name facebook instagram whatsApp email country'
          })
          .lean()
          .exec();

        if (!product?.store) {
          throw new NotFoundException('Product not available');
        }

        // Cache raw product data (without user-specific like status)
        await this.cacheManager.set(cacheKey, product, CACHE_TTLS.PRODUCTS);
      }

      const wishlistProductIds = userId
        ? await this.wishlistService.getWishlistItemsByUserId(userId)
        : [];

      // 3. Get wishlist status (only for logged-in users)
      const productsWithStatus = userId
        ? await this.addWishlistStatus(product, wishlistProductIds)
        : { ...product, isLiked: false };

      return productsWithStatus;
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

  async searchProducts(
    querySearch: ProductFilterandSearchDto,
    userId?: string
  ) {
    try {
      const { search, country, category, minPrice, maxPrice, page, limit } =
        querySearch;

      const skip = (page - 1) * limit;
      if (limit > 50) throw new BadRequestException('Maximum limit is 50');

      if (search && search.trim().length < 2) {
        throw new BadRequestException(
          'Search term must be at least 2 characters'
        );
      }

      const cacheKey = `search:${search}:${country}:${category}:${minPrice}:${maxPrice}:${page}:${limit}`;

      // 3. Try Cache
      const cached = await this.cacheManager.get<{
        products: Product[];
        totalCount: number;
      }>(cacheKey);

      const wishlistProductIds = userId
        ? await this.wishlistService.getWishlistItemsByUserId(userId)
        : [];

      let products = [];
      let totalCount: number = 0;

      if (cached) {
        products = cached.products;
        totalCount = cached.totalCount;
      } else {
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

        [products, totalCount] = await Promise.all([
          this.productModel
            .find(query)
            .populate({
              path: 'store',
              select: '_id name country'
            })
            .collation(collationSettings[country])
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec(),
          this.productModel.countDocuments(query)
        ]);
        await this.cacheManager.set(
          cacheKey,
          { products, totalCount },
          CACHE_TTLS.PRODUCTS
        );
      }

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      const productsWithStatus = this.addWishlistStatus(
        products,
        wishlistProductIds
      );

      const response = {
        data: {
          productsWithStatus
        },
        meta: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: totalCount,
          totalPages,
          hasNextPage,
          hasPreviousPage
        }
      };
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

  private async tryGetCachedProducts(cacheKey: string, userId?: string) {
    const cached = await this.cacheManager.get<{
      data: Product[];
      totalCount: number;
    }>(cacheKey);
    if (cached) {
      const wishlistProductIds = userId
        ? await this.wishlistService.getWishlistItemsByUserId(userId)
        : [];

      return { ...cached, wishlistProductIds };
    }

    return null;
  }

  private addWishlistStatus(products, wishlistIds: string[]) {
    const wishlistSet = new Set(wishlistIds);

    if (Array.isArray(products)) {
      return products.map((product) => ({
        ...product,
        isLiked: wishlistSet.has(product._id.toString())
      }));
    }

    return {
      ...products,
      isLiked: wishlistSet.has(products._id.toString())
    };
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

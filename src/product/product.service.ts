import { BadRequestException, HttpException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from './schemas/product.schema';
import { Model, Types } from 'mongoose';
import { AddNewProductDto } from './dto/add-new-product.dto';
import { unlink, access } from 'fs/promises';
import { Cache } from 'cache-manager'
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UpdateProductDto } from 'src/store/dto/update-product.dto';
import { SearchDto } from './dto/search.dto';
import { ProductFilterDto } from './dto/filter-serch-query.dto';
import { CACHE_TTLS } from 'src/common/constant/cache.constants';



@Injectable()
export class ProductService {

    constructor(@InjectModel(Product.name) private productModel: Model<Product>, @Inject(CACHE_MANAGER) private cacheManager: Cache) { }


    private readonly logger = new Logger(ProductService.name);



    async createProduct(newProduct: AddNewProductDto): Promise<Product> {
        try {
            const product = new this.productModel(newProduct)
            return await product.save()
        } catch (error) {
            this.logger.error(`Error creating product: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to create product due to an unexpected server error.');
        }
    }


    async updateProduct(newProduct: UpdateProductDto, images: string[], productId: string): Promise<Product> {
        const session = await this.productModel.startSession();
        session.startTransaction();
        try {
            // 1. Find existing product
            const existingProduct = await this.productModel.findById(productId).session(session);
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
            this.logger.error(`Error updating product: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to update product due to an unexpected server error.');
        } finally {
            session.endSession();
        }
    }

    async deleteProduct(id: string): Promise<boolean> {
        const session = await this.productModel.startSession();
        session.startTransaction();
        try {
            // 1. Find existing product
            const productToDelete = await this.productModel.findById(id).session(session);
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
            this.logger.error(`Error deleting product: ${error.message}`, error.stack);

            if (error instanceof HttpException) throw error;
            if (error.name === 'MongoNetworkError') {
                throw new ServiceUnavailableException('Database unavailable');
            }

            throw new InternalServerErrorException('Failed to delete product due to an unexpected server error.');
        } finally {
            session.endSession();
        }
    }


    async getProductsByStoreId(storeId: string, page: number, limit: number, country?: string) {
        try {
            const skip = (page - 1) * limit;
            const cacheKey = `products:${storeId}:${country}:page${page}:limit${limit}`;
            const cached = await this.cacheManager.get<Product[]>(cacheKey);
            if (cached) return cached;
            const filtered = await this.productModel.
                find({
                    store: storeId,
                    'store.country': country
                })
                .select('_id name_en name_ar name_no description_no description_ar description_en price category stockQuantity images store createdAt')
                .skip(skip).limit(limit).lean().exec();


            // Caching the result
            await this.cacheManager.set(cacheKey, filtered, CACHE_TTLS.PRODUCTS);

            return filtered || []
        } catch (error) {
            this.logger.error(`Error get products: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to get products due to an unexpected server error.');
        }
    }


    async filteredProducts(filterQueryDto: ProductFilterDto, userCountry: string) {

        try {
            const { category, minPrice, maxPrice, page, limit } = filterQueryDto
            const cacheKey = `products:${userCountry}:${category}:${minPrice}:${maxPrice}:${page}:${limit}`;
            const cached = await this.cacheManager.get<Product[]>(cacheKey);

            if (cached) {
                return cached;
            }

            const skip = (page - 1) * limit

            const query: any = {};

            if (category) {
                query.category = category
            }

            query.country = userCountry

            if (minPrice !== undefined && minPrice !== null && !isNaN(minPrice)) {
                query.price = { ...query.price, $gte: minPrice };
            }
            if (maxPrice !== undefined && maxPrice !== null && !isNaN(maxPrice)) {
                query.price = { ...query.price, $lte: maxPrice };
            }

            if (!userCountry) {
                throw new NotFoundException('user Country not selected')
            }

            const products = await this.productModel
                .find(query)
                .populate({
                    path: 'store',
                    select: '_id owner name country'
                })
                .select('_id country name_en name_ar name_no description_no description_ar description_en price category stockQuantity images store createdAt')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean()
                .exec()

            // Caching the results
            await this.cacheManager.set(cacheKey, products, CACHE_TTLS.PRODUCTS); // cache for 10 minute

            return products || []
        } catch (error) {
            this.logger.error(`Error get filtered products: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to get filtered products due to an unexpected server error.');
        }
    }

    async getProductById(productId: string, userCountry?: string): Promise<Product> {
        try {

            const cacheKey = `product:${productId}:country:${userCountry}`;

            // Try to get from cache
            const cached = await this.cacheManager.get<Product>(cacheKey);

            if (cached) {
                return cached;
            }


            const product = await this.productModel.findById(productId)
                .populate({
                    path: 'store',
                    select: '_id name facebook instagram whatsApp email country'
                })
                .select('_id name_en name_ar name_no description_no description_ar description_en price category stockQuantity images store createdAt')
                .lean()
                .exec();

            if (!product || !product.store) {
                throw new NotFoundException('Product not found or not available in your country');
            }

            await this.cacheManager.set(cacheKey, product, CACHE_TTLS.PRODUCTS)

            return product;
        } catch (error) {
            this.logger.error(`Error get products: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to get products due to an unexpected server error.');
        }
    }



    async findOneById(id: string): Promise<Product> {
        try {
            return await this.productModel.findById(id)
                .select('_id name_en name_ar name_no description_no description_ar description_en price category stockQuantity images store createdAt')
                .lean()
                .exec();
        } catch (error) {
            this.logger.error(`Error get products: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to get products due to an unexpected server error.');
        }
    }



    private async deleteProductImages(imagePaths: string[], storeId: string): Promise<void> {
        const deletePromises = imagePaths.map(async (imagePath) => {
            try {
                access(imagePath);
                await unlink(imagePath);
                this.logger.log(`Deleted old product image: ${imagePath}`);
            } catch (err) {
                if (err.code !== 'ENOENT') { // Ignore "file not found" errors
                    this.logger.warn(`Failed to delete image ${imagePath}: ${err.message}`);
                }
            }
        });
        await Promise.all(deletePromises);
    }


    async searchProducts(querySearch: SearchDto, userCountry: string) {
        try {
            const { search, page, limit } = querySearch

            if (!search || search.trim().length < 2) {
                throw new BadRequestException('Search term must be at least 2 characters');
            }

            const skip = (page - 1) * limit;
            // 2. Decode and sanitize
            const decodedSearch = decodeURIComponent(search.trim());
            // Prevent regex injection
            const sanitizedSearch = this.escapeRegex(decodedSearch);
            const cacheKey = `search:${userCountry}:${sanitizedSearch}:${page}:${limit}`;
            const cached = await this.cacheManager.get<Product[]>(cacheKey);

            if (cached) {
                return cached;
            }

            const query = {
                $or: [
                    { name_ar: { $regex: sanitizedSearch, $options: 'i' } },
                    { name_en: { $regex: sanitizedSearch, $options: 'i' } },
                    { name_no: { $regex: sanitizedSearch, $options: 'i' } },
                    { description_ar: { $regex: sanitizedSearch, $options: 'i' } },
                    { description_en: { $regex: sanitizedSearch, $options: 'i' } },
                    { description_no: { $regex: sanitizedSearch, $options: 'i' } }
                ],
                country: userCountry
            };
            const collationSettings = {
                'syria': { locale: 'ar', strength: 2 },
                'norway': { locale: 'nb', strength: 2 }
            };


            const products = await this.productModel
                .find(query)
                .populate({
                    path: 'store',
                    select: '_id name country',
                })
                .collation(
                    collationSettings[userCountry] || {}
                )
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec()

            await this.cacheManager.set(cacheKey, products, CACHE_TTLS.PRODUCTS);
            return products

        } catch (error) {
            this.logger.error(`Product search failed for term `, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Search operation failed');
        }
    }

    private escapeRegex(text: string): string {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }




    async findNewArrivals(userCountry: string) {
        const cacheKey = `new-arrivals:${userCountry}`;

        try {
            // 1. Try to get from cache first
            const cached = await this.cacheManager.get<{
                newCarsProducts: Product[],
                newPlanetsProducts: Product[],
                newBuildingProducts: Product[],
                newOtherProducts: Product[]
            }>(cacheKey);

            if (cached) {
                return cached;
            }

            // 2. Database queries with country filtering
            const [cars, planets, buildings, other] = await Promise.all([
                this.productModel.find({
                    category: 'cars',
                    country: userCountry
                }).populate({
                    path: 'store',
                    select: '_id owner name country'
                })
                    .sort({ createdAt: -1 })
                    .limit(4)
                    .lean()
                    .exec()
                ,

                this.productModel.find({
                    category: 'planets',
                    country: userCountry
                }).populate({
                    path: 'store',
                    select: '_id owner name country'
                })
                    .sort({ createdAt: -1 })
                    .limit(4)
                    .lean()
                    .exec()
                ,

                this.productModel.find({
                    category: 'buildings',
                    country: userCountry
                }).populate({
                    path: 'store',
                    select: '_id owner name country'
                })
                    .sort({ createdAt: -1 })
                    .limit(4)
                    .lean()
                    .exec()
                ,
                this.productModel.find({
                    category: 'other',
                    country: userCountry
                }).populate({
                    path: 'store',
                    select: '_id owner name country'
                })
                    .sort({ createdAt: -1 })
                    .limit(4)
                    .lean()
                    .exec()
                ,
            ])
            // 3. Prepare response
            const result = {
                newCarsProducts: cars,
                newPlanetsProducts: planets,
                newBuildingProducts: buildings,
                newOtherProducts: other
            };

            // 4. Cache the result
            await this.cacheManager.set(
                cacheKey,
                result,
                CACHE_TTLS.PRODUCTS
            );
            return result;
        } catch (error) {
            this.logger.error(`Error getting new arrivals: ${error.message}`, error.stack);
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

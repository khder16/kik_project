import { BadRequestException, HttpException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from './schemas/product.schema';
import { Model, Types } from 'mongoose';
import { ProductDto } from './dto/product.dto';
import { unlink, access } from 'fs/promises';
import { Cache } from 'cache-manager'
import { CACHE_MANAGER } from '@nestjs/cache-manager';
@Injectable()
export class ProductService {

    constructor(@InjectModel(Product.name) private productModel: Model<Product>, @Inject(CACHE_MANAGER) private cacheManager: Cache) { }


    private readonly logger = new Logger(ProductService.name);



    async createProduct(newProduct: ProductDto): Promise<Product> {
        try {
            const product = new this.productModel(newProduct)
            return await product.save()
        } catch (error) {
            this.logger.error(`Error creating product: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to create product due to an unexpected server error.');
        }
    }


    async updateProduct(newProduct: ProductDto, images: string[], id: string): Promise<Product> {
        const session = await this.productModel.startSession();
        session.startTransaction();
        try {
            // 1. Find existing product
            const existingProduct = await this.productModel.findById(id).session(session);
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
                id,
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
            const cached = await this.cacheManager.get(cacheKey);


            if (cached) return cached;
            const filtered = await this.productModel.
                find({
                    store: storeId,
                    'store.country': country
                })
                .select('_id name_en name_ar name_no description_no description_ar description_en price category stockQuantity images store createdAt')
                .skip(skip).limit(limit).lean().exec();


            // Caching the result
            await this.cacheManager.set(cacheKey, filtered, 300);



            return filtered
        } catch (error) {
            this.logger.error(`Error get products: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to get products due to an unexpected server error.');
        }
    }


    async filteredProducts(category?: string, minPrice?: number, maxPrice?: number, page: number = 1, limit: number = 20, userCountry?: string) {

        try {
            const cacheKey = `products:${userCountry}:${category}:${minPrice}:${maxPrice}:${page}:${limit}`;
            const cached = await this.cacheManager.get(cacheKey);
            if (cached) {
                return cached;
            }


            const skip = (page - 1) * limit

            const query: any = {};

            if (category) {
                query.category = category
            }

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
                    match: { country: userCountry },
                    select: '_id owner name country'
                })
                .select('_id name_en name_ar name_no description_no description_ar description_en price category stockQuantity images store createdAt')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean()
                .exec()
                .then(products => products.filter(p => p.store));

            // Caching the results
            await this.cacheManager.set(cacheKey, products, 300);


            return products
        } catch (error) {
            this.logger.error(`Error get filtered products: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to get filtered products due to an unexpected server error.');
        }
    }

    async getProductById(productId: string, userCountry: string): Promise<Product> {
        try {

            const cacheKey = `product:${productId}:country:${userCountry}`;
            console.log('Cache key:', cacheKey); // Debugging

            // Try to get from cache
            const cached = await this.cacheManager.get<Product>(cacheKey);
            console.log('Cached value:', cached); // Debugging

            if (cached) {
                console.log('Returning from cache');
                return cached;
            }


            const product = await this.productModel.findById(productId)
                .populate({
                    path: 'store',
                    match: { country: userCountry },
                    select: '_id name facebook instagram whatsApp email country'
                })
                .select('_id name_en name_ar name_no description_no description_ar description_en price category stockQuantity images store createdAt')
                .lean()
                .exec();

            if (!product || !product.store) {
                throw new NotFoundException('Product not found or not available in your country');
            }



            await this.cacheManager.set(cacheKey, product)

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


    async searchProducts(search: string, userCountry: string) {
        try {
            if (!search || search.trim().length < 2) {
                throw new BadRequestException('Search term must be at least 2 characters');
            }
            // 2. Decode and sanitize
            const decodedSearch = decodeURIComponent(search.trim());
            // Prevent regex injection
            const sanitizedSearch = this.escapeRegex(decodedSearch);

            const cacheKey = `search:${userCountry}:${sanitizedSearch}`;

            const cached = await this.cacheManager.get<Product[]>(cacheKey);
            if (cached) return cached;
            const products = await this.productModel
                .find({
                    $or: [
                        { name_ar: { $regex: sanitizedSearch, $options: 'i' } },
                        { name_en: { $regex: sanitizedSearch, $options: 'i' } },
                        { name_no: { $regex: sanitizedSearch, $options: 'i' } },
                        { description_ar: { $regex: sanitizedSearch, $options: 'i' } },
                        { description_en: { $regex: sanitizedSearch, $options: 'i' } },
                        { description_no: { $regex: sanitizedSearch, $options: 'i' } }
                    ]
                })
                .populate({
                    path: 'store',
                    match: { country: userCountry },
                    select: '_id name country'
                })
                .collation({ locale: 'ar', strength: 2 })
                .maxTimeMS(5000) // Timeout after 5 seconds
                .sort({ createdAt: -1 })
                .lean()
                .exec()
                .then(products => products.filter(p => p.store));

            await this.cacheManager.set(cacheKey, products, 300);
            return products || [];

        } catch (error) {
            this.logger.error(`Product search failed for term "${search}"`, error.stack);
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
        try {
            const [cars, planets, buildings] = await Promise.all([
                this.productModel.find({ category: 'cars' })
                    .sort({ createdAt: -1 })
                    .limit(4)
                    .exec(),
                this.productModel.find({ category: 'planets' })
                    .sort({ createdAt: -1 })
                    .limit(4)
                    .exec(),
                this.productModel.find({ category: 'buildings' })
                    .sort({ createdAt: -1 })
                    .limit(4)
                    .exec()
            ]);

            return {
                newCarsProducts: cars,
                newPlanetsProducts: planets,
                newBuildingProducts: buildings
            };
        } catch (error) {
            this.logger.error(`Error get new arrivals products: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to get new arrivals products due to an unexpected server error.');
        }
    }
}

import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from './schemas/product.schema';
import { Model } from 'mongoose';
import { ProductDto } from './dto/product.dto';
import { unlink, access } from 'fs/promises';
import { CountryDto } from 'src/auth/dto/selectCountry.dto';
@Injectable()
export class ProductService {

    constructor(@InjectModel(Product.name) private productModel: Model<Product>) { }


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
            throw new InternalServerErrorException('Failed to delete product due to an unexpected server error.');
        } finally {
            session.endSession();
        }
    }


    async getProductsByStoreId(storeId: string, page: number, limit: number, country: string) {
        try {
            const skip = (page - 1) * limit;
            return await this.productModel.
                find({
                    store: storeId,
                    'store.country': country
                })
                .select('_id name_en name_ar name_no description_no description_ar description_en price category stockQuantity images store createdAt')
                .skip(skip).limit(limit).lean().exec();
        } catch (error) {
            this.logger.error(`Error get products: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to get products due to an unexpected server error.');
        }
    }


    async filteredProducts(category?: string, minPrice?: number, maxPrice?: number, page: number = 1, limit: number = 20, country?: string) {
        try {
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
            if (country) {
                query['store.country'] = country;
            }

            const products = await this.productModel
                .find(query)
                .select('_id name_en name_ar name_no description_no description_ar description_en price category stockQuantity images store createdAt')
                .populate('store', '_id name country')
                .skip(skip)
                .limit(limit)
                .exec();
            return products
        } catch (error) {
            this.logger.error(`Error get filtered products: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to get filtered products due to an unexpected server error.');
        }
    }

    async getProductById(_id: string, countryUser: string): Promise<Product> {
        try {
            return await this.productModel.findOne({ _id, 'store.country': countryUser })
                .select('_id name_en name_ar name_no description_no description_ar description_en price category stockQuantity images store createdAt')
                .lean()
                .exec();
        } catch (error) {
            this.logger.error(`Error get products: ${error.message}`, error.stack);
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


    async searchProducts(search: string, lang: string) {
        try {
            if (!search || search.trim().length < 2) {
                throw new BadRequestException('Search term must be at least 2 characters');
            }
            // 2. Decode and sanitize
            const decodedSearch = decodeURIComponent(search.trim());
            // Prevent regex injection
            const sanitizedSearch = this.escapeRegex(decodedSearch);
            const products = await this.productModel
                .find({
                    $or: [
                        { name_ar: { $regex: sanitizedSearch, $options: 'i' } },
                        { name_en: { $regex: sanitizedSearch, $options: 'i' } }, // Fixed: Use decodedSearch here too
                        { name_no: { $regex: sanitizedSearch, $options: 'i' } },
                        { description_ar: { $regex: sanitizedSearch, $options: 'i' } },
                        { description_en: { $regex: sanitizedSearch, $options: 'i' } }, // Fixed
                        { description_no: { $regex: sanitizedSearch, $options: 'i' } }
                    ]
                })
                .collation({ locale: 'ar', strength: 2 })
                .maxTimeMS(5000) // Timeout after 5 seconds
                .lean()
                .exec();


            return products || [];

        } catch (error) {
            this.logger.error(`Product search failed for term "${search}"`, error.stack);
            throw new InternalServerErrorException('Search operation failed');
        }
    }

    private escapeRegex(text: string): string {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }

}

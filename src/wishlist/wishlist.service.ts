import { BadRequestException, HttpException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wishlist, WishlistDocument } from './schemas/wishlist.schema';
import { Cache } from 'cache-manager'
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CACHE_TTLS } from 'src/common/constant/cache.constants';
import { Product } from 'src/product/schemas/product.schema';

@Injectable()
export class WishlistService {
    constructor(
        @InjectModel(Wishlist.name) private readonly wishlistModel: Model<Wishlist>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) { }

    private readonly logger = new Logger(WishlistService.name);



    async getUserWishlist(userId: string, page: number, limit: number) {
        try {

            const cacheKey = `wishlist:${userId}:${page}:${limit}`;
            const cached = await this.cacheManager.get<Product[]>(cacheKey);

            if (cached) return cached

            const skip = (page - 1) * limit
            const wishistPoducts = await this.wishlistModel.find({ user: userId }).populate({
                path: 'products',
                select: 'name_en name_ar name_no price images',
                model: 'Product',
            }).skip(skip).limit(limit).lean().exec()
            if (!wishistPoducts) {
                throw new NotFoundException(`Wishlist for user ${userId} not found`);
            }

            // Caching the results
            await this.cacheManager.set(cacheKey, wishistPoducts, CACHE_TTLS.CART); // cache for 5 minute

            return { wishistPoducts, countOfItems: wishistPoducts.length, }
        } catch (error) {
            this.logger.error(`Error add to get user wishlist: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to get user wishlist due to an unexpected server error.');
        }
    }


    async toggleWishlist(productId: string, userId: string): Promise<Wishlist> {
        // Validate IDs
        if (!Types.ObjectId.isValid(productId)) {
            throw new NotFoundException('Invalid product ID format');
        }

        try {
            // Check if product exists in wishlist
            const existing = await this.wishlistModel.findOne({
                user: userId,
                products: productId
            });
            // Clear wishlist cache for user after each toggle
            await this.cacheManager.del(`wishlist:${userId}:*`);

            // Toggle operation
            if (existing) {
                return await this.removeFromWishlist(productId, userId);
            } else {
                return await this.addToWishlist(productId, userId);
            }
        } catch (error) {
            this.logger.error(`Error toggling wishlist: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to update wishlist');
        }
    }



    async addToWishlist(productId: string, userId: string): Promise<Wishlist> {
        try {

            if (!Types.ObjectId.isValid(productId)) {
                throw new NotFoundException('Invalid product ID format');
            }
            if (!Types.ObjectId.isValid(userId)) {
                throw new NotFoundException('Invalid user ID format');
            }
            const wishlist = await this.wishlistModel
                .findOneAndUpdate(
                    { user: userId },
                    {
                        $push: { products: new Types.ObjectId(productId) }
                    },
                    { new: true, upsert: true },
                ).lean()
                .exec();
            return wishlist;
        } catch (error) {
            this.logger.error(`Error add to wishlist: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to add product to wishlist to an unexpected server error.');
        }
    }

    async removeFromWishlist(productId: string, userId: string) {
        if (!Types.ObjectId.isValid(productId)) {
            throw new NotFoundException('Invalid product ID format');
        }
        if (!Types.ObjectId.isValid(userId)) {
            throw new NotFoundException('Invalid user ID format');
        }

        try {

            const updated = await this.wishlistModel
                .findOneAndUpdate(
                    { user: userId },
                    { $pull: { products: new Types.ObjectId(productId) } },
                    { new: true },
                )
                .exec();

            if (!updated) {
                throw new NotFoundException(`Wishlist for user ${userId} not found`);
            }

            return updated
        } catch (error) {
            this.logger.error(`Error removing from wishlist: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to remove product from wishlist');
        }
    }



    async getWishlist(userId: string) {
        if (!Types.ObjectId.isValid(userId)) {
            throw new NotFoundException('Invalid user ID format');
        }

        try {
            const wishlistItems = await this.wishlistModel.find({ user: userId })
                .populate('product', '_id name_en name_no name_ar price images category')
                .sort({ addedAt: -1 });

            return {
                count: wishlistItems.length,
                items: wishlistItems
            };
        } catch (error) {
            this.logger.error(`Error getting wishlist: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to get wishlist items');
        }
    }


    async findOrCreateWishlist(userId: string): Promise<WishlistDocument> {
        let wishlist = await this.wishlistModel.findOne({ user: userId }).exec();
        if (!wishlist) {
            wishlist = await this.wishlistModel.create({ user: userId, products: [] });
        }
        return wishlist;
    }


}

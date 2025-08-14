import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wishlist, WishlistDocument } from './schemas/wishlist.schema';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CACHE_TTLS } from 'src/common/constant/cache.constants';
import { Product } from 'src/product/schemas/product.schema';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name) private readonly wishlistModel: Model<Wishlist>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  private readonly logger = new Logger(WishlistService.name);

  async getUserWishlist(userId: string, page: number, limit: number) {
    try {
      const skip = (page - 1) * limit;
      if (limit > 50) throw new BadRequestException('Maximum limit is 50');

      const cacheKey = `wishlist:${userId}:${page}:${limit}`;
      const cacheCountKey = `wishlist_count:${userId}`;
      const cached = await this.cacheManager.get<{
        data: Product[];
        meta: any;
      }>(cacheKey);

      if (cached) return cached;

      const [wishistPoducts, totalItems] = await Promise.all([
        this.wishlistModel
          .find({ user: userId })
          .populate({
            path: 'products',
            select:
              '_id country name_en name_ar name_no description_no description_ar description_en price category stockQuantity images store createdAt',
            model: 'Product'
          })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.wishlistModel
          .aggregate([
            { $match: { user: userId } },
            { $project: { count: { $size: '$products' } } },
            { $group: { _id: null, total: { $sum: '$count' } } }
          ])
          .exec()
      ]);

      if (!wishistPoducts) {
        throw new NotFoundException(`Wishlist for user ${userId} not found`);
      }

      const totalCount = totalItems[0]?.total || 0;
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      const response = {
        data: wishistPoducts,
        meta: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: totalCount,
          totalPages,
          hasNextPage,
          hasPreviousPage
        }
      };

      // Caching the results
      await Promise.all([
        this.cacheManager.set(cacheKey, response, CACHE_TTLS.CART),
        this.cacheManager.set(cacheCountKey, totalCount, CACHE_TTLS.CART)
      ]);
      return response;
    } catch (error) {
      this.logger.error(
        `Error add to get user wishlist: ${error.message}`,
        error.stack
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to get user wishlist due to an unexpected server error.'
      );
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

      // Toggle operation
      if (existing) {
        return await this.removeFromWishlist(productId, userId);
      } else {
        return await this.addToWishlist(productId, userId);
      }
    } catch (error) {
      this.logger.error(
        `Error toggling wishlist: ${error.message}`,
        error.stack
      );
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
          { new: true, upsert: true }
        )
        .lean()
        .exec();

      await this.clearUserWishlistCache(userId);

      return wishlist;
    } catch (error) {
      this.logger.error(`Error add to wishlist: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to add product to wishlist to an unexpected server error.'
      );
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
          { new: true }
        )
        .exec();

      if (!updated) {
        throw new NotFoundException(`Wishlist for user ${userId} not found`);
      }

      await this.clearUserWishlistCache(userId);
      return updated;
    } catch (error) {
      this.logger.error(
        `Error removing from wishlist: ${error.message}`,
        error.stack
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to remove product from wishlist'
      );
    }
  }

  async getWishlist(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID format');
    }

    try {
      const wishlistItems = await this.wishlistModel
        .find({ user: userId })
        .populate(
          'product',
          '_id name_en name_no name_ar price images category'
        )
        .sort({ addedAt: -1 });

      return {
        count: wishlistItems.length,
        items: wishlistItems
      };
    } catch (error) {
      this.logger.error(
        `Error getting wishlist: ${error.message}`,
        error.stack
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get wishlist items');
    }
  }

  async findOrCreateWishlist(userId: string): Promise<WishlistDocument> {
    let wishlist = await this.wishlistModel.findOne({ user: userId }).exec();
    if (!wishlist) {
      wishlist = await this.wishlistModel.create({
        user: userId,
        products: []
      });
    }
    return wishlist;
  }
  private async clearUserWishlistCache(userId: string) {
    const maxPages = 5;
    const deletePromises = [];

    for (let page = 1; page <= maxPages; page++) {
      const key = `wishlist:${userId}:${page}:10`;

      deletePromises.push(this.cacheManager.del(key));
    }
    const countKey = `wishlist_count:${userId}`;
    deletePromises.push(this.cacheManager.del(countKey));

    await Promise.all(deletePromises);
  }
}

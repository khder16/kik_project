// wishlist-data.service.ts
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wishlist, WishlistDocument } from './schemas/wishlist.schema';

@Injectable()
export class WishlistCommonService {
  constructor(
    @InjectModel(Wishlist.name)
    private readonly wishlistModel: Model<WishlistDocument>
  ) {}

  private readonly logger = new Logger(WishlistCommonService.name);

  async getWishlistItemsByUserId(userId: string) {
    try {
      const wishlistItems = await this.wishlistModel
        .findOne({ user: userId })
        .select('products')
        .lean()
        .exec();
      const productsId = wishlistItems.products.map((i) => i.toString());
      return new Set(productsId);
      
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
}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Wishlist, WishlistSchema } from './schemas/wishlist.schema';
import { WishlistCommonService } from './wishlist-common.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Wishlist.name, schema: WishlistSchema }])
  ],
  providers: [WishlistCommonService],
  exports: [WishlistCommonService] 
})
export class WishlistCommonModule {}

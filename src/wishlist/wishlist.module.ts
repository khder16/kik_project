import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';
import { Wishlist, WishlistSchema } from './schemas/wishlist.schema';
import { ProductModule } from '../product/product.module'
import { UserModule } from '../user/user.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Wishlist.name, schema: WishlistSchema }
        ]),
        ProductModule,
        UserModule,
        CacheModule.register(),
        WishlistModule
    ],
    controllers: [WishlistController],
    providers: [WishlistService],
    exports: [WishlistService]
})
export class WishlistModule { }
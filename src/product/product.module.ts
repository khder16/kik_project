import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { Product, ProductSchema } from './schemas/product.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ImageProcessingService } from './image-process.service';
import { ReviewsModule } from 'src/reviews/reviews.module';
import { WishlistCommonModule } from 'src/wishlist/wishlist-common.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    WishlistCommonModule,
    ReviewsModule
  ],
  providers: [ProductService, ImageProcessingService],
  controllers: [ProductController],
  exports: [ProductService, MongooseModule, ImageProcessingService]
})
export class ProductModule {}
